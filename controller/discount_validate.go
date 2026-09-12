package controller

import (
	"errors"
	"io"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/service"

	"github.com/gin-gonic/gin"
)

// discountValidateRequest 两个字段都可选：都不传就按 default 分组做静态校验，
// 传了就按这个客户 / 这条线路来验。
type discountValidateRequest struct {
	UserId    *int `json:"user_id"`
	ChannelId *int `json:"channel_id"`
}

// ValidateDiscountPlan 保存前提示：存方案时算一遍，会亏就标红提示，并指出是哪个模型 / 厂商。
// POST /api/discount/admin/plans/:id/validate
// 只读接口，不写任何表；violations 是提示不是否决，运营确认后仍然可以保存。
func ValidateDiscountPlan(c *gin.Context) {
	planId, ok := parseDiscountIdParam(c)
	if !ok {
		return
	}

	// body 允许为空：不带任何参数时就是「先看看这个方案本身亏不亏」。
	var req discountValidateRequest
	if err := c.ShouldBindJSON(&req); err != nil && !errors.Is(err, io.EOF) {
		common.ApiErrorMsg(c, "请求参数格式错误")
		return
	}

	userId := 0
	if req.UserId != nil {
		if *req.UserId <= 0 {
			common.ApiErrorMsg(c, "user_id 必须是正整数")
			return
		}
		userId = *req.UserId
	}
	channelId := 0
	if req.ChannelId != nil {
		if *req.ChannelId <= 0 {
			common.ApiErrorMsg(c, "channel_id 必须是正整数")
			return
		}
		channelId = *req.ChannelId
	}

	result, err := service.ValidateDiscountPlan(planId, userId, channelId)
	if err != nil {
		// 方案不存在、客户不存在都属于「输入的问题」，回 400 且把话说清楚；
		// 其余（数据库等）走通用错误处理。
		if errors.Is(err, service.ErrDiscountValidatePlanNotFound) ||
			errors.Is(err, service.ErrDiscountValidateUserNotFound) {
			common.ApiErrorMsg(c, err.Error())
			return
		}
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}
