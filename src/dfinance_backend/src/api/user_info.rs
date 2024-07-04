use crate::State;
use crate::{protocol::libraries::types::types::*, with_state};

pub fn is_phase2_or_phase3_active() -> Result<(), String> {
    let current_phase = with_state(|state| *state.current_phase.get());

    if current_phase == 2 || current_phase == 3 {
        Ok(())
    } else {
        Err("function will only run if the current phase is 2 or 3".to_string())
    }
}

pub fn is_phase3_active() -> Result<(), String> {
    let current_phase = with_state(|state| *state.current_phase.get());

    if current_phase == 3 {
        Ok(())
    } else {
        Err("function will only run if the current phase is 2 or 3".to_string())
    }
}
