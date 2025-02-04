use candid::{CandidType, Deserialize};
/* 
 * @title Pagination Parameters
 * @notice Defines the parameters required for paginated data retrieval.
 * @dev This struct is used to specify the pagination details for API requests.
 *
 * @param page The current page number (zero-based index).
 * @param page_size The number of items per page.
 */
#[derive(CandidType, Deserialize)]
pub struct PaginationParams {
    pub page: usize,
    pub page_size: usize,
}

/* 
 * @title Pagination Response
 * @notice Defines a generic paginated response structure.
 * @dev This struct is used to return paginated results from queries.
 *
 * @typeparam T The type of items being paginated.
 * @param items A vector containing the items for the requested page.
 * @param total_items The total number of items available (for all pages).
 */
#[derive(CandidType, Deserialize)]
pub struct PaginationResponse<T> {
    pub items: Vec<T>,
    pub total_items: usize,
}
