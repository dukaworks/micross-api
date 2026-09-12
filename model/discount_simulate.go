package model

import "strings"

// DiscountChannelCandidate 是试算用的一条候选上游线路：
// 能力表说「这个分组下这个模型能走它」，进货折扣来自线路本身。
type DiscountChannelCandidate struct {
	ChannelId   int
	ChannelName string
	CostRatio   *string // 未录入时为 nil（列里是 NULL 或空串）
}

// GetDiscountChannelCandidates 列出「这些分组下、这个模型当前可用」的上游线路。
//
// 直查能力表，不读 channel_cache 的 group2model2channels：试算是一次性的管理查询，
// 不该受缓存刷新时机影响，那个缓存结构也不适合接口层直接消费。
// 同一渠道挂在多个分组下会在能力表里出现多行，这里按渠道去重（试算只关心有哪几条线路）。
func GetDiscountChannelCandidates(groups []string, modelName string) ([]*DiscountChannelCandidate, error) {
	candidates := make([]*DiscountChannelCandidate, 0)
	modelName = strings.TrimSpace(modelName)
	if len(groups) == 0 || modelName == "" {
		return candidates, nil
	}

	// 第一步：从能力表挑出渠道 id。这里不 join channels——两张表都有 group 列，
	// 而 commonGroupCol 不带表前缀，join 之后会歧义。
	channelIds := make([]int, 0)
	if err := DB.Model(&Ability{}).
		Distinct("channel_id").
		Where(commonGroupCol+" IN ? AND model = ? AND enabled = ?", groups, modelName, true).
		Pluck("channel_id", &channelIds).Error; err != nil {
		return nil, err
	}
	if len(channelIds) == 0 {
		return candidates, nil
	}

	// 第二步：取线路名与进货折扣。
	channels := make([]*Channel, 0)
	if err := DB.Select("id", "name", "cost_ratio").Where("id IN ?", channelIds).Find(&channels).Error; err != nil {
		return nil, err
	}
	channelById := make(map[int]*Channel, len(channels))
	for _, channel := range channels {
		channelById[channel.Id] = channel
	}
	for _, channelId := range channelIds {
		channel, ok := channelById[channelId]
		if !ok {
			// 能力表还挂着一条已经删掉的线路：跳过，不让试算跟着失败。
			continue
		}
		candidate := &DiscountChannelCandidate{
			ChannelId:   channel.Id,
			ChannelName: channel.Name,
		}
		// 空串与 NULL 都表示「没录进货折扣」；非空但解析不出数字属于脏数据，
		// 那要留到算毛利时才能区分开并给出对应提示，这里不判。
		if channel.CostRatio != nil {
			if trimmed := strings.TrimSpace(*channel.CostRatio); trimmed != "" {
				candidate.CostRatio = &trimmed
			}
		}
		candidates = append(candidates, candidate)
	}
	return candidates, nil
}

// GetVendorNameByModelName 顺着 模型名 → 模型目录 → 厂商 取厂商名。
// 目录里没有这个模型、或它没挂厂商时返回空串（都不是错误）。
// 与折扣解析走的是同一条链路，口径只能有一份。
func GetVendorNameByModelName(modelName string) (string, error) {
	return resolveVendorName(modelName)
}
