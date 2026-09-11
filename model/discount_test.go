package model

import (
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"github.com/shopspring/decimal"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// 折扣是计费乘数，其存取必须精确：这里覆盖两件容易退化的事——
// 1) decimal(10,6) 列存的是字符串字段，读回来解析后必须与写入口径完全一致（小数位、尾数都不能漂）
// 2) 第二次 AutoMigrate 不得再产生 DDL（默认值口径不一致会导致每次启动都 ALTER TABLE）
func testDiscountTables(t *testing.T, db *gorm.DB, recorder *migrationSQLRecorder) {
	t.Helper()

	require.NoError(t, migrateDiscountTables(db))

	plan := &DiscountPlan{
		Name:            fmt.Sprintf("discount-contract-%d", time.Now().UnixNano()),
		OwnerType:       DiscountOwnerPlatform,
		BaseDiscount:    "0.900000",
		MinDiscount:     "0.005000",
		BillingMode:     DiscountBillingUsage,
		CommissionRatio: "0.150000",
		Status:          DiscountStatusEnabled,
	}
	require.NoError(t, db.Create(plan).Error)
	t.Cleanup(func() { _ = db.Unscoped().Delete(&DiscountPlan{}, plan.Id).Error })

	rule := &DiscountRule{
		PlanId:     plan.Id,
		ScopeType:  DiscountScopeModel,
		ScopeValue: "claude-3-5-sonnet",
		Discount:   "0.123456",
	}
	require.NoError(t, db.Create(rule).Error)
	t.Cleanup(func() { _ = db.Unscoped().Delete(&DiscountRule{}, rule.Id).Error })

	binding := &DiscountBinding{
		SubjectType: DiscountSubjectUser,
		SubjectId:   plan.Id,
		PlanId:      plan.Id,
		Source:      DiscountSourceManual,
		Status:      DiscountStatusEnabled,
	}
	require.NoError(t, db.Create(binding).Error)
	t.Cleanup(func() { _ = db.Unscoped().Delete(&DiscountBinding{}, binding.Id).Error })

	var storedPlan DiscountPlan
	require.NoError(t, db.First(&storedPlan, plan.Id).Error)
	assertDiscountValue(t, "0.900000", storedPlan.BaseDiscount)
	assertDiscountValue(t, "0.005000", storedPlan.MinDiscount)
	assertDiscountValue(t, "0.150000", storedPlan.CommissionRatio)

	var storedRule DiscountRule
	require.NoError(t, db.First(&storedRule, rule.Id).Error)
	assertDiscountValue(t, "0.123456", storedRule.Discount)

	var storedBinding DiscountBinding
	require.NoError(t, db.First(&storedBinding, binding.Id).Error)
	assert.Equal(t, DiscountSubjectUser, storedBinding.SubjectType)
	assert.Equal(t, plan.Id, storedBinding.PlanId)

	// 折扣是计费乘数，缺省必须落在"无折扣"，绝不能是 0（0 等于免费）
	defaulted := &DiscountPlan{Name: plan.Name + "-default"}
	defaulted.NormalizeDefaults()
	require.NoError(t, db.Create(defaulted).Error)
	t.Cleanup(func() { _ = db.Unscoped().Delete(&DiscountPlan{}, defaulted.Id).Error })
	var storedDefaulted DiscountPlan
	require.NoError(t, db.First(&storedDefaulted, defaulted.Id).Error)
	assertDiscountValue(t, DiscountNone, storedDefaulted.BaseDiscount)

	recorder.reset()
	require.NoError(t, migrateDiscountTables(db))
	assert.Empty(t, recorder.schemaMutations(), "a second migration must not repeat schema DDL")
}

// assertDiscountValue 比较折扣的数值口径而非字面量：
// MySQL / PostgreSQL 的 decimal 列会补足 6 位小数，SQLite 的 NUMERIC 亲和性则按 REAL 存取，
// 读回来可能是 "0.9"。计费只关心解析后的十进制值，故以此为准。
func assertDiscountValue(t *testing.T, expected string, actual string) {
	t.Helper()
	expectedValue, err := decimal.NewFromString(expected)
	require.NoError(t, err)
	actualValue, err := decimal.NewFromString(strings.TrimSpace(actual))
	require.NoError(t, err, "stored discount %q must be a decimal string", actual)
	assert.True(t, expectedValue.Equal(actualValue), "expected %s, got %s", expected, actual)
}

func TestDiscountTablesSQLite(t *testing.T) {
	recorder := &migrationSQLRecorder{}
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{Logger: recorder})
	require.NoError(t, err)
	testDiscountTables(t, db, recorder)
}

func TestDiscountTablesConfiguredDatabases(t *testing.T) {
	tests := []struct {
		name      string
		env       string
		dialector func(string) gorm.Dialector
	}{
		{name: "mysql", env: "TEST_MYSQL_DSN", dialector: func(dsn string) gorm.Dialector { return mysql.Open(dsn) }},
		{name: "postgres", env: "TEST_POSTGRES_DSN", dialector: func(dsn string) gorm.Dialector {
			return postgres.New(postgres.Config{DSN: dsn, PreferSimpleProtocol: true})
		}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			dsn := strings.TrimSpace(os.Getenv(test.env))
			if dsn == "" {
				t.Skip(test.env + " is not configured")
			}
			recorder := &migrationSQLRecorder{}
			db, err := gorm.Open(test.dialector(dsn), &gorm.Config{Logger: recorder})
			require.NoError(t, err)
			sqlDB, err := db.DB()
			require.NoError(t, err)
			t.Cleanup(func() { _ = sqlDB.Close() })
			testDiscountTables(t, db, recorder)
		})
	}
}

// 折扣是计费乘数，取值边界必须钉死：0 等于免费、大于 1 等于加价，两者都不允许进库。
func TestNormalizeDiscountValues(t *testing.T) {
	tests := []struct {
		raw      string
		discount string // 期望值，留空表示应当报错
		ratio    string // 比例口径（min_discount / commission_ratio），留空表示应当报错
	}{
		{raw: "0.9", discount: "0.900000", ratio: "0.900000"},
		{raw: "0.123456", discount: "0.123456", ratio: "0.123456"},
		{raw: " 1 ", discount: "1.000000", ratio: "1.000000"},
		{raw: "0", ratio: "0.000000"},
		{raw: "0.000000", ratio: "0.000000"},
		{raw: "-0.5"},
		{raw: "1.000001"},
		{raw: "abc"},
		{raw: ""},
	}
	for _, test := range tests {
		discount, err := NormalizeDiscount(test.raw)
		if test.discount == "" {
			assert.Error(t, err, "NormalizeDiscount(%q) 应当报错", test.raw)
		} else {
			require.NoError(t, err, "NormalizeDiscount(%q)", test.raw)
			assert.Equal(t, test.discount, discount)
		}

		ratio, err := NormalizeDiscountRatio(test.raw)
		if test.ratio == "" {
			assert.Error(t, err, "NormalizeDiscountRatio(%q) 应当报错", test.raw)
		} else {
			require.NoError(t, err, "NormalizeDiscountRatio(%q)", test.raw)
			assert.Equal(t, test.ratio, ratio)
		}
	}
}

func TestPickActiveDiscountBinding(t *testing.T) {
	now := int64(1700000000)

	t.Run("按来源优先级取用", func(t *testing.T) {
		picked := pickActiveDiscountBinding([]DiscountBinding{
			{Id: 1, PlanId: 11, Source: DiscountSourceMigration, Status: DiscountStatusEnabled},
			{Id: 2, PlanId: 12, Source: DiscountSourceSubscription, Status: DiscountStatusEnabled},
			{Id: 3, PlanId: 13, Source: DiscountSourceManual, Status: DiscountStatusEnabled, EffectiveFrom: now + 3600},
			{Id: 4, PlanId: 14, Source: DiscountSourceManual, Status: DiscountStatusEnabled, EffectiveTo: now},
		}, now)
		require.NotNil(t, picked)
		assert.Equal(t, 12, picked.PlanId, "手工绑定尚未生效或已过期时，应回落到订阅绑定")
	})

	t.Run("同来源取最新的一条", func(t *testing.T) {
		picked := pickActiveDiscountBinding([]DiscountBinding{
			{Id: 7, PlanId: 21, Source: DiscountSourceManual, Status: DiscountStatusEnabled},
			{Id: 9, PlanId: 22, Source: DiscountSourceManual, Status: DiscountStatusEnabled},
			{Id: 10, PlanId: 23, Source: DiscountSourceManual, Status: DiscountStatusEnabled, EffectiveTo: now + 1},
		}, now)
		require.NotNil(t, picked)
		assert.Equal(t, 23, picked.PlanId)
	})

	t.Run("没有生效绑定", func(t *testing.T) {
		picked := pickActiveDiscountBinding([]DiscountBinding{
			{Id: 1, PlanId: 31, Source: DiscountSourceManual, Status: DiscountStatusDisabled},
			{Id: 2, PlanId: 32, Source: DiscountSourceManual, Status: DiscountStatusEnabled, EffectiveFrom: now + 60},
		}, now)
		assert.Nil(t, picked)
	})
}

// users.discount_plan_id 是折扣解析的快路径，必须与绑定事实表同时写入，
// 否则会出现"绑定生效了但计费读不到"的不一致。
func TestDiscountBindingWritesUserFastPath(t *testing.T) {
	previousDB, previousLogDB := DB, LOG_DB
	previousMainDatabaseType, previousLogDatabaseType := common.MainDatabaseType(), common.LogDatabaseType()
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, common.DatabaseTypeSQLite)
	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	DB, LOG_DB = db, db
	require.NoError(t, db.AutoMigrate(&User{}, &DiscountPlan{}, &DiscountRule{}, &DiscountBinding{}))
	sqlDB, err := db.DB()
	require.NoError(t, err)
	t.Cleanup(func() {
		DB, LOG_DB = previousDB, previousLogDB
		common.SetDatabaseTypes(previousMainDatabaseType, previousLogDatabaseType)
		_ = sqlDB.Close()
	})

	user := User{
		Username: "discount-binding-user",
		Password: "unused-password-hash",
		Role:     common.RoleCommonUser,
		Status:   common.UserStatusEnabled,
		Group:    "default",
	}
	require.NoError(t, DB.Create(&user).Error)

	subscriptionPlan := &DiscountPlan{
		Name: "订阅折扣", OwnerType: DiscountOwnerPlatform, BillingMode: DiscountBillingSubscription,
		BaseDiscount: "0.950000", MinDiscount: "0", CommissionRatio: "0", Status: DiscountStatusEnabled,
	}
	require.NoError(t, subscriptionPlan.Insert())
	manualPlan := &DiscountPlan{
		Name: "手工折扣", OwnerType: DiscountOwnerPlatform, BillingMode: DiscountBillingUsage,
		BaseDiscount: "0.800000", MinDiscount: "0", CommissionRatio: "0", Status: DiscountStatusEnabled,
	}
	require.NoError(t, manualPlan.Insert())

	subscriptionBinding := &DiscountBinding{
		SubjectType: DiscountSubjectUser, SubjectId: user.Id, PlanId: subscriptionPlan.Id,
		Source: DiscountSourceSubscription, Status: DiscountStatusEnabled,
	}
	require.NoError(t, BindDiscountPlan(subscriptionBinding))
	requireUserDiscountPlanId(t, user.Id, subscriptionPlan.Id)

	manualBinding := &DiscountBinding{
		SubjectType: DiscountSubjectUser, SubjectId: user.Id, PlanId: manualPlan.Id,
		Source: DiscountSourceManual, Status: DiscountStatusEnabled,
	}
	require.NoError(t, BindDiscountPlan(manualBinding))
	requireUserDiscountPlanId(t, user.Id, manualPlan.Id)

	require.ErrorIs(t, BindDiscountPlan(&DiscountBinding{
		SubjectType: DiscountSubjectUser, SubjectId: user.Id, PlanId: manualPlan.Id,
		Source: DiscountSourceManual, Status: DiscountStatusEnabled,
	}), ErrDiscountBindingExists)
	require.ErrorIs(t, DeleteDiscountPlan(manualPlan.Id), ErrDiscountPlanInUse)

	require.NoError(t, UnbindDiscountPlan(manualBinding.Id))
	requireUserDiscountPlanId(t, user.Id, subscriptionPlan.Id)

	require.NoError(t, UnbindDiscountPlan(subscriptionBinding.Id))
	requireUserDiscountPlanId(t, user.Id, 0)

	require.NoError(t, DeleteDiscountPlan(subscriptionPlan.Id), "只剩已解绑的历史记录时，方案可以删除")
}

func requireUserDiscountPlanId(t *testing.T, userId int, expected int) {
	t.Helper()
	var stored User
	require.NoError(t, DB.Select("id", "discount_plan_id").First(&stored, userId).Error)
	require.Equal(t, expected, stored.DiscountPlanId)
}
