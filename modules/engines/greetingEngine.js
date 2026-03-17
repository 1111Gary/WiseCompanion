import { TimeUtils } from '../utils/timeUtils.js';
const JUDGEMENT_POOLS = {
    core: [
        "这一步你如果做错，后面再努力也只是补窟窿。",
        "不是这件事坑你，是你当时没停下来判断。",
        "多数人不是输在能力，是输在“以为没事”。",
        "今天这一步看似小，结果会被放大。",
        "真正要命的决定，都是当时没人提醒的。",
        "如果这一步不稳，后面再顺也没用。",
        "后悔的瞬间，通常会想起“当时要是多想一分钟”。",
        "错的不是结果，是你当时没判断。",
        "这不是机会问题，是方向问题。",
        "判断清楚，比动作快更重要。"
    ],
    money: [
        "钱不会立刻出问题，判断错了才会。",
        "真正亏钱，往往发生在“觉得不至于吧”的那一步。",
        "如果这笔钱不好撤，那你就不该现在进去。",
        "不是收益低，是风险被你忽略了。",
        "能不能赚钱不重要，能不能全身而退更重要。",
        "判断失误，才是最贵的成本。",
        "真正的坑，从来不写在规则第一页。",
        "如果你需要自我安慰，这件事大概率不稳。"
    ],
    night: [
        "夜里做的决定，白天很少感谢自己。",
        "晚上最容易为了“别白忙”而继续错。",
        "现在这个点，最不适合追加投入。",
        "夜里冲动的一步，明天撤不回来。",
        "如果你现在犹豫，其实已经有答案了。",
        "多半错误决定，发生在“差一点就完成”的时候。",
        "现在不停，明天就要止损。",
        "夜深了，更应该判断，而不是推进。",
        "今天已经够累了，不要再给自己埋雷。"
    ],
    soft: [
        "停下来判断，不是浪费时间。",
        "你不是慢，是在减少未来麻烦。",
        "今天少做一步，可能省下很多。",
        "不急着动手，也是一种进展。"
    ]
};

function pickJudgementLine(ctx = {}) {
    let pool = [];

    if (ctx.isNight)
        pool = JUDGEMENT_POOLS.night.concat(JUDGEMENT_POOLS.core);
    else if (ctx.recommendCount > 0)
        pool = JUDGEMENT_POOLS.money.concat(JUDGEMENT_POOLS.core);
    else
        pool = JUDGEMENT_POOLS.core.concat(JUDGEMENT_POOLS.soft);

    return pool[Math.floor(Math.random() * pool.length)] || '';
}

export const GreetingEngine = {

    generate(ctx = {}) {

        const isNight = TimeUtils.isNight();
        const timeText = TimeUtils.getGreetingPrefix();

        const judgementLine = pickJudgementLine({
            ...ctx,
            isNight
        });

        return {
            text: `${timeText}，${judgementLine}`,
            isNight
        };
    }

};