// Tab Weaver - Epic Meme Reactions for Tab Counts
// Because we're all degenerates with too many tabs 🤣

const TAB_MEMES = {
    // Special meme numbers that deserve legendary status
    memeNumbers: {
        69: "😏 Managing 69 tabs - Nice... you cultured individual! 😏",
        420: "🌿 Managing 420 tabs - BLAZIN'! Someone's been browsing while... relaxed! 🌿",
        666: "😈 Managing 666 tabs - THE NUMBER OF THE BEAST! Pure chaos! 😈", 
        1337: "💀 Managing 1337 tabs - L33T H4X0R! You're officially a legend! 💀",
        2000: "🏆 Managing 2000 tabs - Y2K SURVIVOR! Your PC hasn't exploded yet! 🏆",
        2020: "😷 Managing 2020 tabs - COVID YEAR! Pandemic procrastination! 😷",
        4200: "🚀 Managing 4200 tabs - OVER 9000... wait, 4200! ABSOLUTE MADLAD! 🚀",
        6969: "😏😏 Managing 6969 tabs - DOUBLE NICE! Your tab game is LEGENDARY! 😏😏",
        8888: "🍀 Managing 8888 tabs - LUCKY NUMBERS! Pure fortune! 🍀",
        9000: "💥 Managing 9000 tabs - IT'S OVER 9000!!! VEGETA IS PROUD! 💥",
        9999: "🔢 Managing 9999 tabs - SO CLOSE TO 10K! The anticipation is killing us! 🔢",
        10000: "🎉 Managing 10000 tabs - 10K CLUB! WELCOME TO TAB INFINITY! 🎉"
    },

    // Regular ranges with personality
    ranges: [
        { min: 0, max: 0, emoji: "😳", message: "No tabs... are you even human?" },
        { min: 1, max: 1, emoji: "🤔", message: "1 tab... either you're a minimalist or just started browsing" },
        { min: 2, max: 2, emoji: "😌", message: "2 tabs... still in control, I respect that" },
        { min: 3, max: 3, emoji: "👍", message: "3 tabs... the holy trinity of browsing!" },
        { min: 4, max: 5, emoji: "😎", message: "tabs - keeping it reasonable, nice!" },
        { min: 6, max: 9, emoji: "🙂", message: "tabs - solid browsing without the chaos" },
        { min: 10, max: 14, emoji: "👀", message: "tabs - I see you starting to lose control..." },
        { min: 15, max: 19, emoji: "😅", message: "tabs - okay, things are getting spicy!" },
        { min: 20, max: 29, emoji: "🔥", message: "tabs - you're on fire! (Your RAM is crying)" },
        { min: 30, max: 39, emoji: "😰", message: "tabs - someone's been BUSY! Slow down!" },
        { min: 40, max: 49, emoji: "🤯", message: "tabs - BRUH! Are you researching the meaning of life?" },
        { min: 50, max: 68, emoji: "💀", message: "tabs - RIP your computer's memory" },
        { min: 70, max: 99, emoji: "👹", message: "tabs - you're officially a tab demon!" },
        { min: 100, max: 199, emoji: "🚨", message: "tabs - ALERT! ALERT! Tab hoarder detected!" },
        { min: 200, max: 299, emoji: "🌪️", message: "tabs - you're a walking tornado of chaos!" },
        { min: 300, max: 419, emoji: "🤖", message: "tabs - are you even human anymore??" },
        { min: 421, max: 499, emoji: "👽", message: "tabs - definitely alien behavior" },
        { min: 500, max: 665, emoji: "🔥", message: "tabs - your browser is literally on fire!" },
        { min: 667, max: 999, emoji: "😱", message: "tabs - I'm calling the authorities!" },
        { min: 1000, max: 1336, emoji: "🎮", message: "tabs - FINAL BOSS LEVEL ACHIEVED!" },
        { min: 1338, max: 1999, emoji: "💻", message: "tabs - your computer has achieved sentience" },
        { min: 2001, max: 4199, emoji: "🚀", message: "tabs - HOUSTON WE HAVE A PROBLEM!" },
        { min: 4201, max: 6968, emoji: "🌌", message: "tabs - you've transcended into another dimension" },
        { min: 6970, max: 8999, emoji: "🎯", message: "tabs - this is beyond science!" },
        { min: 9001, max: 9998, emoji: "⚡", message: "tabs - UNLIMITED POWER!!!" },
        { min: 10001, max: 99999, emoji: "♾️", message: "tabs - you've broken the internet!" },
        { min: 100000, max: Infinity, emoji: "🛸", message: "tabs - please report to NASA immediately" }
    ],

    // Special celebration messages for milestones
    milestones: {
        100: "🎉 CENTURY CLUB! 100 tabs of pure madness!",
        500: "🏅 HALF-THOUSAND! Your dedication is terrifying!",
        1000: "🏆 THOUSAND CLUB! You're officially insane!",
        5000: "👑 TAB ROYALTY! All hail the tab king/queen!",
        10000: "🌟 TAB GOD! You've achieved the impossible!"
    }
};

// Function to get the perfect meme for any tab count
function getTabMeme(count) {
    // Check for exact meme numbers first (they get priority!)
    if (TAB_MEMES.memeNumbers[count]) {
        return TAB_MEMES.memeNumbers[count];
    }

    // Check for milestone celebrations
    if (TAB_MEMES.milestones[count]) {
        return `🎊 ${TAB_MEMES.milestones[count]} 🎊`;
    }

    // Find the appropriate range
    for (const range of TAB_MEMES.ranges) {
        if (count >= range.min && count <= range.max) {
            return `${range.emoji} Managing ${count} ${range.message}`;
        }
    }

    // Fallback for any number we missed (shouldn't happen but just in case)
    return `🤷‍♂️ Managing ${count} tabs - I'm speechless...`;
}

// Easter egg: Random funny reactions for when people refresh too much
const REFRESH_MEMES = [
    "Stop refreshing, your tabs aren't going anywhere! 😂",
    "Refresh addiction detected! 🔄",
    "The tabs are the same... you know that, right? 🤨",
    "Refreshing won't make your tab count go down! 😏",
    "Fun fact: Refreshing doesn't organize your tabs for you! 📚"
];

function getRefreshMeme() {
    return REFRESH_MEMES[Math.floor(Math.random() * REFRESH_MEMES.length)];
}

// Export for use in the main script
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { getTabMeme, getRefreshMeme, TAB_MEMES };
} else if (typeof window !== 'undefined') {
    // Browser environment
    window.TabMemes = { getTabMeme, getRefreshMeme, TAB_MEMES };
}