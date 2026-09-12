package controller

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

// 参数校验这部分不需要建库：出错的都是入参，走不到 service。
// 盯住的是接口契约——参数不对回「success=false + 能看懂的中文提示」，而不是 500。
func TestDiscountValidateRequestValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cases := []struct {
		name        string
		planId      string
		body        string
		wantMessage string
	}{
		{name: "方案 ID 不是数字", planId: "abc", body: "{}", wantMessage: "无效的 ID"},
		{name: "方案 ID 为零", planId: "0", body: "{}", wantMessage: "无效的 ID"},
		{name: "user_id 不是正整数", planId: "1", body: `{"user_id": 0}`, wantMessage: "user_id 必须是正整数"},
		{name: "channel_id 不是正整数", planId: "1", body: `{"channel_id": -3}`, wantMessage: "channel_id 必须是正整数"},
		{name: "body 不是 JSON", planId: "1", body: "not-json-at-all", wantMessage: "请求参数格式错误"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(recorder)
			context.Params = gin.Params{{Key: "id", Value: tc.planId}}
			context.Request = httptest.NewRequest(http.MethodPost,
				"/api/discount/admin/plans/"+tc.planId+"/validate", strings.NewReader(tc.body))
			context.Request.Header.Set("Content-Type", "application/json")

			ValidateDiscountPlan(context)

			assert.Equal(t, http.StatusOK, recorder.Code)
			assert.Contains(t, recorder.Body.String(), `"success":false`)
			assert.Contains(t, recorder.Body.String(), tc.wantMessage)
		})
	}
}

// 不带任何参数保存时也算一次合法请求（前端只想问「这个方案本身亏不亏」），
// 不该被当成参数错误。这里用「方案不存在」来确认它确实走进了业务逻辑。
func TestDiscountValidateAcceptsEmptyBody(t *testing.T) {
	gin.SetMode(gin.TestMode)
	previousDB, previousLogDB := model.DB, model.LOG_DB
	previousMainType, previousLogType := common.MainDatabaseType(), common.LogDatabaseType()
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, common.DatabaseTypeSQLite)
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:validate-controller-%d?mode=memory&cache=shared", time.Now().UnixNano())), &gorm.Config{})
	require.NoError(t, err)
	model.DB, model.LOG_DB = db, db
	require.NoError(t, db.AutoMigrate(&model.DiscountPlan{}))
	sqlDB, err := db.DB()
	require.NoError(t, err)
	t.Cleanup(func() {
		model.DB, model.LOG_DB = previousDB, previousLogDB
		common.SetDatabaseTypes(previousMainType, previousLogType)
		_ = sqlDB.Close()
	})

	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Params = gin.Params{{Key: "id", Value: "1"}}
	context.Request = httptest.NewRequest(http.MethodPost, "/api/discount/admin/plans/1/validate", nil)
	context.Request.Header.Set("Content-Type", "application/json")

	ValidateDiscountPlan(context)

	body := recorder.Body.String()
	assert.Equal(t, http.StatusOK, recorder.Code)
	assert.NotContains(t, body, "请求参数格式错误", "空 body 是合法请求")
	assert.Contains(t, body, "折扣方案不存在")
}
