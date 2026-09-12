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
// 直查能力表，不读 channel_cache 的 group2model2channels：试算是一次性的管理查询，
// 不该受缓存刷新时机影响，那个缓存结构也不适合接口层直接消费。
func GetDiscountChannelCandidates(groups []string, modelName string) ([]*DiscountChannelCandidate, error) {
	modelName = strings.TrimSpace(modelName)
	byModel, err := GetDiscountChannelCandidatesByModels(groups, []string{modelName})
	if err != nil {
		return nil, err
	}
	candidates := byModel[modelName]
	if candidates == nil {
		candidates = make([]*DiscountChannelCandidate, 0)
	}
	return candidates, nil
}

// GetDiscountChannelCandidatesByModels 一次问一批模型：保存前校验要按规则的作用范围
// 把「这个厂商名下的模型」一次性问一遍，逐个模型问会打出一串查询。
// 同一渠道挂在多个分组下会在能力表里出现多行，这里按「模型 + 渠道」去重。
func GetDiscountChannelCandidatesByModels(groups []string, modelNames []string) (map[string][]*DiscountChannelCandidate, error) {
	result := make(map[string][]*DiscountChannelCandidate)
	groupList := normalizeLookupValues(groups)
	nameList := normalizeLookupValues(modelNames)
	if len(groupList) == 0 || len(nameList) == 0 {
		return result, nil
	}

	// 第一步：从能力表挑出「模型 + 渠道」对。这里不 join channels——两张表都有 group 列，
	// 而 commonGroupCol 不带表前缀，join 之后会歧义。
	type abilityRow struct {
		Model     string
		ChannelId int
	}
	rows := make([]abilityRow, 0)
	if err := DB.Model(&Ability{}).
		Distinct("model", "channel_id").
		Where(commonGroupCol+" IN ? AND model IN ? AND enabled = ?", groupList, nameList, true).
		Order("channel_id ASC").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return result, nil
	}

	// 第二步：取线路名与进货折扣。
	channelIds := make([]int, 0, len(rows))
	for _, row := range rows {
		channelIds = append(channelIds, row.ChannelId)
	}
	channels := make([]*Channel, 0)
	if err := DB.Select("id", "name", "cost_ratio").Where("id IN ?", channelIds).Find(&channels).Error; err != nil {
		return nil, err
	}
	channelById := make(map[int]*Channel, len(channels))
	for _, channel := range channels {
		channelById[channel.Id] = channel
	}
	for _, row := range rows {
		channel, ok := channelById[row.ChannelId]
		if !ok {
			// 能力表还挂着一条已经删掉的线路：跳过，不让查询跟着失败。
			continue
		}
		result[row.Model] = append(result[row.Model], buildDiscountChannelCandidate(channel))
	}
	return result, nil
}

// buildDiscountChannelCandidate 把一条线路转成候选：空串与 NULL 都表示「没录进货折扣」；
// 非空但解析不出数字属于脏数据，那要留到算毛利时才能区分开并给出对应提示，这里不判。
func buildDiscountChannelCandidate(channel *Channel) *DiscountChannelCandidate {
	candidate := &DiscountChannelCandidate{
		ChannelId:   channel.Id,
		ChannelName: channel.Name,
	}
	if channel.CostRatio != nil {
		if trimmed := strings.TrimSpace(*channel.CostRatio); trimmed != "" {
			candidate.CostRatio = &trimmed
		}
	}
	return candidate
}

// GetVendorNameByModelName 顺着 模型名 → 模型目录 → 厂商 取厂商名。
// 目录里没有这个模型、或它没挂厂商时返回空串（都不是错误）。
// 与折扣解析走的是同一条链路，口径只能有一份。
func GetVendorNameByModelName(modelName string) (string, error) {
	return resolveVendorName(modelName)
}
