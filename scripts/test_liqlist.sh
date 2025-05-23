#!/bin/bash

TOTAL_CALLS=200
TOTAL_PAGES=10
PAGE_SIZE=20
LOG_DIR="logs"
TIME_LOG="time_metrics.log"

# Function to call the canister with a specific identity
call_with_identity() {
  local id=$1
  local start_time=$(date +%s%3N)  # Milliseconds
  local log_file="$LOG_DIR/call_$id.log"
  {
    echo "Start Time: $start_time"
    dfx canister --identity "user$id" call dfinance_backend get_liquidation_users_concurrent "($TOTAL_PAGES, $PAGE_SIZE)"
    local end_time=$(date +%s%3N)
    echo "End Time: $end_time"
  } > "$log_file" 2>&1 &
}

# Ensure logs directory exists
mkdir -p "$LOG_DIR"
rm -f "$LOG_DIR"/*.log "$TIME_LOG"

# Record global start time in milliseconds
global_start=$(date +%s%3N)

# Launch concurrent calls
for ((i = 3; i <= TOTAL_CALLS; i++)); do
  call_with_identity "$i"
done

# Wait for all background jobs to finish
wait

# Record global end time in milliseconds
global_end=$(date +%s%3N)

# Initialize earliest and latest response times
first_response=9999999999999
last_response=0

for file in "$LOG_DIR"/call_*.log; do
  end_time=$(grep "End Time" "$file" | awk '{print $3}')
  if [[ $end_time -lt $first_response ]]; then
    first_response=$end_time
  fi
  if [[ $end_time -gt $last_response ]]; then
    last_response=$end_time
  fi
done

# Convert epoch ms to human-readable format
format_time() {
  local ms=$1
  local s=${ms:0:-3}
  local millis=${ms: -3}
  date -u -d "@$s" +"%Y-%m-%d %H:%M:%S.$millis (UTC)"
}

# Compute durations in seconds with milliseconds precision
duration_in_seconds() {
  local delta_ms=$1
  printf "%.3f" "$(echo "$delta_ms / 1000" | bc -l)"
}

# Compute durations
first_delay=$((first_response - global_start))
last_delay=$((last_response - global_start))
total_duration=$((global_end - global_start))

# Write to log
{
  echo "Global Start Time:          $(format_time $global_start)"
  echo "First Response Received At: $(format_time $first_response)"
  echo "Last Response Received At:  $(format_time $last_response)"
  echo "Global End Time:            $(format_time $global_end)"
  echo
  echo "Time to First Response:     $(duration_in_seconds $first_delay) seconds"
  echo "Time to Last Response:      $(duration_in_seconds $last_delay) seconds"
  echo "Total Duration:             $(duration_in_seconds $total_duration) seconds"
} | tee "$TIME_LOG"

echo "All $TOTAL_CALLS concurrent calls completed."
