use candid::{CandidType, Deserialize};

// PaginationParams is a struct that represents the pagination parameters. It has two fields: page and page_size. The page field represents the page number and the page_size field represents the number of items per page.
#[derive(CandidType, Deserialize)]
pub struct PaginationParams {
    pub page: usize,
    pub page_size: usize,
}

// PaginationResponse is a struct that represents the pagination response. It has two fields: items and total_items. The items field is a vector of items and the total_items field represents the total number of items.
#[derive(CandidType, Deserialize)]
pub struct PaginationResponse<T> {
    pub items: Vec<T>,
    pub total_items: usize,
}
