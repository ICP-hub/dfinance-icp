use ic_stable_structures::{memory_manager::VirtualMemory, DefaultMemoryImpl};

// The virtual memory type used in this example is the default memory implementation.
pub type VMem = VirtualMemory<DefaultMemoryImpl>;
