import Database from 'better-sqlite3';
import path from 'node:path';
import { state } from '../uvidbot_state';

/**
 * Parses a time string into total seconds for comparison.
 */
export function parseTimeToSeconds(timeStr: any): number | null {
    if (timeStr == null) return null;
    const trimmed = String(timeStr).trim();
    const parts = trimmed.split(':');
    if (parts.length > 3) return null;

    let seconds = 0;
    if (parts.length === 3) {
        const h = parseFloat(parts[0]);
        const m = parseFloat(parts[1]);
        const s = parseFloat(parts[2]);
        if (isNaN(h) || isNaN(m) || isNaN(s)) return null;
        seconds = h * 3600 + m * 60 + s;
    } else if (parts.length === 2) {
        const m = parseFloat(parts[0]);
        const s = parseFloat(parts[1]);
        if (isNaN(m) || isNaN(s)) return null;
        seconds = m * 60 + s;
    } else if (parts.length === 1) {
        const s = parseFloat(parts[0]);
        if (isNaN(s)) return null;
        seconds = s;
    } else {
        return null;
    }

    return isNaN(seconds) ? null : seconds;
}

export function getLeaderboardContent(starId: string, starName: string): string {
    const dbPath = path.join(__dirname, '..', 'main.db');
    const db = new Database(dbPath);

    const rows = db.prepare(`
        SELECT player, time
        FROM sm64_daily_rta
        WHERE star_id = ?
        ORDER BY time ASC;
    `).all(starId) as { player: string; time: string }[];

    db.close();

    if (!rows || rows.length === 0) {
        return `🏆 **SM64 Daily Leaderboard - ${starName}**\n\nNo submissions yet for this star!`;
    }

    let message = `🏆 **SM64 Daily Leaderboard - ${starName}**\n\n`;
    rows.forEach((row, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        message += `${medal} **${row.player}** — \`${row.time}\`\n`;
    });

    return message;
}

export function getStarName(starId: string): string | null {
    const dbPath = path.join(__dirname, '..', 'main.db');
    const db = new Database(dbPath);

    const row = db.prepare(`
        SELECT name FROM sm64_ss WHERE id = ?
    `).get(starId) as { name: string } | undefined;

    db.close();

    return row ? row.name : null;
}

export async function selectNewDailyStar(client: any) {
    console.log(`[${new Date().toISOString()}] Selecting daily SM64 star...`);
    try {
        const dbPath = path.join(__dirname, '..', 'main.db');
        const db = new Database(dbPath);

        const chosenStar = db.prepare('SELECT id, name FROM sm64_ss WHERE is_100_coin = false AND ss_rta = false ORDER BY RANDOM() LIMIT 1').get() as { id: number | string; name: string } | undefined;
        if (!chosenStar) {
            console.log('No available SM64 stars found matching criteria.');
            db.close();
            return;
        }

        const sm64_daily_id = chosenStar.id;
        const sm64_daily_name = chosenStar.name;

        state.currentDailyStarId = String(sm64_daily_id);
        state.currentDailyStarName = sm64_daily_name;

        console.log(`Selected SM64 star: ID ${sm64_daily_id}, Name: ${sm64_daily_name}`);
    } catch (err) {
        console.error('Error selecting daily SM64 star:', err);
    }
}

export async function selectNewDaily100Star(client: any) {
    console.log(`[${new Date().toISOString()}] Selecting daily SM64 100-coin star...`);
    try {
        const dbPath = path.join(__dirname, '..', 'main.db');
        const db = new Database(dbPath);

        const chosenStar = db.prepare('SELECT id, name FROM sm64_ss WHERE is_100_coin = true AND ss_rta = false ORDER BY RANDOM() LIMIT 1').get() as { id: number | string; name: string } | undefined;
        if (!chosenStar) {
            console.log('No available SM64 100-coin stars found matching criteria.');
            db.close();
            return;
        }

        const sm64_daily_id = chosenStar.id;
        const sm64_daily_name = chosenStar.name;

        state.currentDaily100StarId = String(sm64_daily_id);
        state.currentDaily100StarName = sm64_daily_name;

        console.log(`Selected SM64 100-coin star: ID ${sm64_daily_id}, Name: ${sm64_daily_name}`);
    } catch (err) {
        console.error('Error selecting daily SM64 100-coin star:', err);
    }
}

export async function announceDailyStars(client: any) {
    const currentDate = new Date().toISOString().split('T')[0];
    const message = `## ${currentDate} Single Star RTA Challenge\n* Single Star: ${state.currentDailyStarName}\n* 100 Coin Star: ${state.currentDaily100StarName}`;

    console.log(`[${new Date().toISOString()}] Announcing daily stars to #sm64-daily-rta...`);
    try {
        const guilds = await client.guilds.fetch();
        for (const [guildId, oauth2Guild] of guilds) {
            try {
                const guild = await oauth2Guild.fetch();
                await guild.channels.fetch();
                const channel = guild.channels.cache.find(c => c.name === 'sm64-daily-rta' && c.isTextBased()) as any;
                if (channel) {
                    await channel.send(message);
                    console.log(`Sent daily stars announcement to #sm64-daily-rta in guild ${guild.name}`);
                }
            } catch (guildErr) {
                console.error(`Error sending daily stars announcement in guild ${oauth2Guild.name}:`, guildErr);
            }
        }
    } catch (err) {
        console.error('Error announcing daily stars:', err);
    }
}
