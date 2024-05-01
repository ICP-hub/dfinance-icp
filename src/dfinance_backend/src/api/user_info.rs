use crate::State;
use crate::{types::*, with_state};
pub fn username_exists(state: &State, username: String) -> bool {
    state.users.values().any(|val| val.username == username)
}

#[cfg(test)]
mod test {
    use super::username_exists;
    use crate::State;

    #[test]
    fn check_username_exist() {
        let mut state = State::default();
        let username_state = username_exists(&state, "abhishek".to_string());

        assert_eq!(username_state, false);
    }
}

pub fn is_phase2_or_phase3_active() -> Result<(), String> {
    let current_phase = with_state(|state| state.current_phase);

    if current_phase == 2 || current_phase == 3 {
        Ok(())
    } else {
        Err("function will only run if the current phase is 2 or 3".to_string())
    }
}

pub fn is_phase3_active() -> Result<(), String> {
    let current_phase = with_state(|state| state.current_phase);

    if current_phase == 3 {
        Ok(())
    } else {
        Err("function will only run if the current phase is 2 or 3".to_string())
    }
}
