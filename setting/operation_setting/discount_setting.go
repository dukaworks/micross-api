package operation_setting

import "github.com/QuantumNous/new-api/setting/config"

// DiscountSetting 是客户折扣相关的经营策略，由管理员在后台配置。
type DiscountSetting struct {
	// MinMarginRatio 是「毛利底线」：当一条线路的进货折扣与客户折扣之间的差额小于它时，
	// 试算与保存前校验会把这条线路标成「会亏」。缺省 0 表示「不赔本就行」，
	// 即只要进货折扣不高于客户折扣就算可做。
	//
	// 与折扣字段同一口径——字符串 decimal（禁 float），空串按 0 处理。
	MinMarginRatio string `json:"min_margin_ratio"`

	// EnableBillingDiscount 是「折扣是否参与实际扣费」的总开关。
	//
	// 默认 false：折扣只做配置与试算，扣费仍按官方标价——这样折扣方案可以
	// 先建好、先在界面上试算比对，确认无误后再打开开关放量。
	// 打开后也只对「绑定了启用中方案」的客户生效，其余人照旧原价。
	EnableBillingDiscount bool `json:"enable_billing_discount"`
}

var discountSetting = DiscountSetting{
	MinMarginRatio:        "0",
	EnableBillingDiscount: false,
}

func init() {
	config.GlobalConfig.Register("discount_setting", &discountSetting)
}

func GetDiscountSetting() *DiscountSetting {
	return &discountSetting
}
