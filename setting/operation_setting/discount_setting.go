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
}

var discountSetting = DiscountSetting{
	MinMarginRatio: "0",
}

func init() {
	config.GlobalConfig.Register("discount_setting", &discountSetting)
}

func GetDiscountSetting() *DiscountSetting {
	return &discountSetting
}
