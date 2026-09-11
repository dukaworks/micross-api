/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import type {
  AffiliateCodeResponse,
  AffiliateTransferRequest,
  AffiliateTransferResponse,
} from '@/features/wallet/types'
import { api } from '@/lib/api'

// ============================================================================
// Earnings API Functions
//
// Referral commission endpoints. They belong to the customer's own earnings
// surface rather than to the wallet: the wallet page only holds money going
// out (top-up, redemption), while commission is money coming in.
// ============================================================================

/**
 * Get the signed-in user's referral code
 */
export async function getAffiliateCode(): Promise<AffiliateCodeResponse> {
  const res = await api.get('/api/user/aff')
  return res.data
}

/**
 * Transfer accumulated commission to the main balance
 */
export async function transferAffiliateQuota(
  request: AffiliateTransferRequest
): Promise<AffiliateTransferResponse> {
  const res = await api.post('/api/user/aff_transfer', request)
  return res.data
}
