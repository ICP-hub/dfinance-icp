use ic_stable_structures::memory_manager::MemoryId;

/* The memory id for the user map. This is the only memory id used in this example.
you can add more memory ids if you want to use more memories.*/
pub const ASSET_INDEX_MEMORY_ID: MemoryId = MemoryId::new(0);
pub const USER_PROFILE_MEMORY_ID: MemoryId = MemoryId::new(1);
pub const RESERVES_MEMORY_ID: MemoryId = MemoryId::new(2);
