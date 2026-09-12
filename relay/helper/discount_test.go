package helper

import (
	"testing"

	relaycommon "github.com/QuantumNous/new-api/relay/common"
	hosttypes "github.com/QuantumNous/new-api/types"
	"github.com/stretchr/testify/assert"
)

// TestApplyUserDiscountRatioKeepsRatioWithoutDiscount 守的是「改造前后逐笔一致」这条线：
// 没绑方案（或总开关关着）时，倍率结构体必须原封不动地传出去——
// 不是「乘了个 1」，而是连一个字段都不许动，这样下游任何一处都不可能算出不一样的钱。
func TestApplyUserDiscountRatioKeepsRatioWithoutDiscount(t *testing.T) {
	original := hosttypes.GroupRatioInfo{
		GroupRatio:        1.25,
		GroupSpecialRatio: 0.5,
		HasSpecialRatio:   true,
	}

	t.Run("没有 relayInfo 时原样返回", func(t *testing.T) {
		assert.Equal(t, original, ApplyUserDiscountRatio(nil, original))
	})

	t.Run("没有客户身份时原样返回", func(t *testing.T) {
		relayInfo := &relaycommon.RelayInfo{UserId: 0, OriginModelName: "gpt-4o"}

		assert.Equal(t, original, ApplyUserDiscountRatio(relayInfo, original))
	})

	t.Run("总开关关着时原样返回", func(t *testing.T) {
		relayInfo := &relaycommon.RelayInfo{UserId: 42, OriginModelName: "gpt-4o"}

		assert.Equal(t, original, ApplyUserDiscountRatio(relayInfo, original))
	})
}
