package model

import "strings"

// GetDiscountScopeModelNames 找出「这条折扣规则实际覆盖哪些模型」。
//
// 这是保存前提示（validate）才需要的能力：规则本身只写一个取值（模型名或厂商名），
// 但它实际管着一批模型，要问「这批模型会不会亏」就得先把这批名字还原出来。
//
// model 规则直接就是模型名，也可能是结尾带 `*` 的前缀——匹配口径与折扣解析里的
// matchDiscountScope 保持一致：只认结尾一个 `*`，中间还带 `*` 的写法按字面模型名处理。
// vendor 规则要顺着厂商名回模型目录找它名下的模型。
//
// 一个都找不到时返回空集合：那说明这条规则打不到任何真实模型，调用方据此提示。
func GetDiscountScopeModelNames(scopeType string, scopeValue string) ([]string, error) {
	scopeValue = strings.TrimSpace(scopeValue)
	if scopeValue == "" {
		return []string{}, nil
	}
	switch scopeType {
	case DiscountScopeModel:
		prefix, wildcard := strings.CutSuffix(scopeValue, "*")
		if wildcard && !strings.Contains(prefix, "*") {
			return findDiscountModelNamesByPrefix(prefix)
		}
		return []string{scopeValue}, nil
	case DiscountScopeVendor:
		return findDiscountModelNamesByVendorName(scopeValue)
	default:
		// 作用范围只有 model 与 vendor 两种。库里出现别的值说明数据被改坏了，
		// 这里不猜语义，按「覆盖不到任何模型」交给调用方处理。
		return []string{}, nil
	}
}

// findDiscountModelNamesByPrefix 找出模型目录里以该前缀开头的模型。
// LIKE 只用来粗筛——模型名里可能出现 `_`、`%`，它们在 LIKE 里是通配符，
// 所以最终结果以 Go 侧的 HasPrefix 为准，不让通配符带进误匹配。
func findDiscountModelNamesByPrefix(prefix string) ([]string, error) {
	names := make([]string, 0)
	prefix = strings.TrimSpace(prefix)
	if prefix == "" {
		return names, nil
	}
	matched := make([]string, 0)
	if err := DB.Model(&Model{}).
		Where("model_name LIKE ?", prefix+"%").
		Order("model_name ASC").
		Pluck("model_name", &matched).Error; err != nil {
		return nil, err
	}
	for _, name := range matched {
		if strings.HasPrefix(name, prefix) {
			names = append(names, name)
		}
	}
	return names, nil
}

// findDiscountModelNamesByVendorName 找出挂在某个厂商名下的模型。
// 厂商名按完整字符串相等匹配，与折扣解析里 matchDiscountScope 的口径一致。
// 目录里没有这个厂商（名字打错了、厂商被删了）返回空集合，不是错误。
func findDiscountModelNamesByVendorName(vendorName string) ([]string, error) {
	names := make([]string, 0)
	vendorName = strings.TrimSpace(vendorName)
	if vendorName == "" {
		return names, nil
	}
	vendors := make([]*Vendor, 0)
	if err := DB.Where("name = ?", vendorName).Find(&vendors).Error; err != nil {
		return nil, err
	}
	if len(vendors) == 0 {
		return names, nil
	}
	vendorIds := make([]int, 0, len(vendors))
	for _, vendor := range vendors {
		vendorIds = append(vendorIds, vendor.Id)
	}
	if err := DB.Model(&Model{}).
		Where("vendor_id IN ?", vendorIds).
		Order("model_name ASC").
		Pluck("model_name", &names).Error; err != nil {
		return nil, err
	}
	return names, nil
}
