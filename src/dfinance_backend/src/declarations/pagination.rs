use candid::{CandidType, Deserialize};

#[derive(CandidType, Deserialize)]
pub struct PaginationParams {
    pub page: usize,
    pub page_size: usize,
}

#[derive(CandidType, Deserialize)]
pub struct PaginationResponse<T> {
    pub items: Vec<T>,
    pub total_items: usize,
}
