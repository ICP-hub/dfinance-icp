#[cfg(feature = "canbench")]
pub mod benches {
    use crate::api::query::cycle_checker;
    use canbench_rs::bench;
    // ic_cdk::println!("Starting cycle_checker benchmark...");
    #[bench]
    async fn cycle_checker_bench() {
        ic_cdk::eprintln!("Starting cycle_checker benchmark...");
        let result = cycle_checker().await;
        match result {
            Ok((balance, _cert)) => {
                ic_cdk::eprintln!("Cycle balance: {:?}", balance);
            }
            Err(e) => {
                ic_cdk::eprintln!("Error: {:?}", e);
            }
        }
    }

    
}