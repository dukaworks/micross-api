package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// 试算接口的参数校验发生在查库之前，所以这几个用例不需要建库。
// 保护的是接口契约：参数不对要回「success=false + 能看懂的中文提示」，
// 而不是抛 500 或者拿空参数去查库。
func TestSimulateDiscountRequestValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	cases := []struct {
		name        string
		query       string
		wantMessage string
	}{
		{name: "缺少 user_id", query: "model=gpt-4o", wantMessage: "请指定要试算的客户"},
		{name: "user_id 不是数字", query: "user_id=abc&model=gpt-4o", wantMessage: "请指定要试算的客户"},
		{name: "user_id 为零", query: "user_id=0&model=gpt-4o", wantMessage: "请指定要试算的客户"},
		{name: "缺少 model", query: "user_id=1", wantMessage: "请指定要试算的模型"},
		{name: "model 只有空格", query: "user_id=1&model=%20%20", wantMessage: "请指定要试算的模型"},
		{name: "channel_id 不是数字", query: "user_id=1&model=gpt-4o&channel_id=x", wantMessage: "channel_id 必须是正整数"},
		{name: "channel_id 为零", query: "user_id=1&model=gpt-4o&channel_id=0", wantMessage: "channel_id 必须是正整数"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(recorder)
			context.Request = httptest.NewRequest(http.MethodGet, "/api/discount/admin/simulate?"+tc.query, nil)

			SimulateDiscount(context)

			assert.Equal(t, http.StatusOK, recorder.Code)
			assert.Contains(t, recorder.Body.String(), `"success":false`)
			assert.Contains(t, recorder.Body.String(), tc.wantMessage)
		})
	}
}
