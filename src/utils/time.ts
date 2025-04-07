// src/utils/time.ts
export function timeAgo(timestamp: number): string {
    const now = Date.now() / 1000; // Current time in seconds
    const seconds = Math.floor(now - timestamp);

    const units = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 }
    ];

    for (const unit of units) {
        const value = Math.floor(seconds / unit.seconds);
        if (value >= 1) {
            return `${value} ${unit.label}${value > 1 ? "s" : ""} ago`
        };
    }

    return "just now";
}
