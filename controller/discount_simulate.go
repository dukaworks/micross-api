package controller

import (
	"errors"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/service"

	"github.com/gin-gonic/gin"
)

// SimulateDiscount 试算：输入客户 + 模型，返回按几折、会走哪几条线路、每条赚多少。
// GET /api/discount/admin/simulate?user_id=12&model=gpt-4o[&channel_id=5]
// 只读接口，不写任何表；报价侧不存静态成本基准。
func SimulateDiscount(c *gin.Context) {
	userId, err := strconv.Atoi(strings.TrimSpace(c.Query("user_id")))
	if err != nil || userId <= 0 {
		common.ApiErrorMsg(c, "请指定要试算的客户（user_id）")
		return
	}
	modelName := strings.TrimSpace(c.Query("model"))
	if modelName == "" {
		common.ApiErrorMsg(c, "请指定要试算的模型（model）")
		return
	}
	channelId := 0
	if raw := strings.TrimSpace(c.Query("channel_id")); raw != "" {
		channelId, err = strconv.Atoi(raw)
		if err != nil || channelId <= 0 {
			common.ApiErrorMsg(c, "channel_id 必须是正整数")
			return
		}
	}

	result, err := service.SimulateDiscount(userId, modelName, channelId)
	if err != nil {
		// 客户不存在、线路不在候选里都属于「输入的问题」，回 400 且直接把话说清楚；
		// 其余（数据库等）走通用错误处理。
		if errors.Is(err, service.ErrDiscountSimulateUserNotFound) ||
			errors.Is(err, service.ErrDiscountSimulateChannelNotAvailable) {
			common.ApiErrorMsg(c, err.Error())
			return
		}
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}
