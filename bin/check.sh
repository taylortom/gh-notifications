#!/bin/bash

API_URL="${GH_NOTIFICATIONS_URL:-http://localhost:3000}"
API_TOKEN="${GH_NOTIFICATIONS_API_TOKEN:-test-token-123}"

response=$(curl -sf -H "Authorization: Bearer $API_TOKEN" "$API_URL/notifications")

if [ $? -ne 0 ]; then
  echo "Failed to fetch notifications. Is the server running?"
  exit 1
fi

count=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])")

if [ "$count" = "0" ]; then
  echo "No open notifications."
  exit 0
fi

echo "$response" | python3 -c "
import sys, json

data = json.load(sys.stdin)
all_notifications = data['notifications']
check_suites = [n for n in all_notifications if n['subject']['type'] == 'CheckSuite']
notifications = [n for n in all_notifications if n['subject']['type'] != 'CheckSuite']

# Group by repo
by_repo = {}
for n in notifications:
    repo = n['repository']
    by_repo.setdefault(repo, []).append(n)

print(f\"  {len(notifications)} open notifications\" + (f\" ({len(check_suites)} check suites hidden)\" if check_suites else '') + \"\n\")

# Stats
total_unread = sum(1 for n in notifications if n['unread'])
ci_hidden = 0
by_reason = {}
by_type = {}

for repo, items in sorted(by_repo.items()):
    # Separate CI from non-CI
    ci_items = [n for n in items if n['reason'] == 'ci_activity']
    other_items = [n for n in items if n['reason'] != 'ci_activity']

    # Only keep most recent CI item per repo
    if len(ci_items) > 1:
        ci_hidden += len(ci_items) - 1
        ci_items = ci_items[:1]

    display_items = other_items + ci_items

    # Track stats from display items
    for n in display_items:
        r = n['reason'].replace('_', ' ')
        by_reason[r] = by_reason.get(r, 0) + 1
        by_type[n['subject']['type']] = by_type.get(n['subject']['type'], 0) + 1

    count_label = len(display_items)
    print(f\"  \033[1m{repo}\033[0m ({count_label})\")
    for n in display_items:
        s = n['subject']
        type_icon = {'PullRequest': 'PR', 'Issue': 'IS', 'Commit': 'CM'}.get(s['type'], s['type'])
        reason = n['reason'].replace('_', ' ')
        link = s.get('htmlUrl') or ''
        unread = '\033[33m●\033[0m' if n['unread'] else ' '
        title = s['title']

        if link:
            title = f\"\033]8;;{link}\033\\\\{title}\033]8;;\033\\\\\"

        print(f\"    {unread} [{type_icon}] {title}  \033[2m{reason}\033[0m\")
    print()

# Summary
displayed = sum(by_reason.values())
print(f\"  \033[2m{'─' * 40}\033[0m\")
print(f\"  \033[1mSummary\033[0m\")
print(f\"    {displayed} shown, {total_unread} unread\" + (f\", {ci_hidden} CI hidden\" if ci_hidden else ''))
type_str = ', '.join(f\"{v} {k}\" for k, v in sorted(by_type.items(), key=lambda x: -x[1]))
if type_str:
    print(f\"    \033[2mBy type:\033[0m  {type_str}\")
reason_str = ', '.join(f\"{v} {k}\" for k, v in sorted(by_reason.items(), key=lambda x: -x[1]))
if reason_str:
    print(f\"    \033[2mReason:\033[0m   {reason_str}\")
print()
"
