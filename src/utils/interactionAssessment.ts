export type InteractionAssessment = {
  supportive: number
  respectful: number
  flirtatious: number
  romantic: number
  vulnerable: number
  loyal: number
  playful: number
  socialInvitation: number

  rude: number
  pressuring: number
  dishonest: number
  hostile: number
}

function clampSignal(
  value: number,
) {
  return Math.max(
    0,
    Math.min(
      1,
      value,
    ),
  )
}

function containsAny(
  text: string,
  phrases: string[],
) {
  return phrases.some(
    (phrase) =>
      text.includes(phrase),
  )
}

function matchesAny(
  text: string,
  patterns: RegExp[],
) {
  return patterns.some(
    (pattern) =>
      pattern.test(text),
  )
}

function addSignal(
  current: number,
  amount: number,
) {
  return clampSignal(
    current + amount,
  )
}

export function assessInteraction(
  userMessage: string,
): InteractionAssessment {
  const lower =
    userMessage
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()

  let supportive = 0
  let respectful = 0
  let flirtatious = 0
  let romantic = 0
  let vulnerable = 0
  let loyal = 0
  let playful = 0
  let socialInvitation = 0

  let rude = 0
  let pressuring = 0
  let dishonest = 0
  let hostile = 0

  /*
   * ================================================================
   * SUPPORT / REASSURANCE
   * ================================================================
   */

  if (
    containsAny(
      lower,
      [
        'i am here for you',
        "i'm here for you",
        'you are not alone',
        "you're not alone",
        'you can count on me',
        'i believe in you',
        'i understand',
        'take your time',
        'no rush',
        'when you are ready',
        "when you're ready",
        'you do not have to tell me',
        "you don't have to tell me",
        'you do not need to tell me',
        "you don't need to tell me",
        'you do not have to face this alone',
        "you don't have to face this alone",
      ],
    )
  ) {
    supportive =
      addSignal(
        supportive,
        0.8,
      )
  }

  if (
    matchesAny(
      lower,
      [
        /\bi(?:'ll| will) help\b/,
        /\bi(?:'ll| will) support\b/,
        /\bi(?:'ll| will) stay\b/,
        /\bi(?:'ll| will) be here\b/,
      ],
    )
  ) {
    supportive =
      addSignal(
        supportive,
        0.8,
      )
  }

  /*
   * ================================================================
   * RESPECT / BOUNDARY RESPECT
   * ================================================================
   */

  if (
    containsAny(
      lower,
      [
        'i respect you',
        'i respect your choice',
        'i respect your decision',
        'i respect your privacy',
        'with respect',
        'if you are comfortable',
        "if you're comfortable",
        'when you are ready',
        "when you're ready",
        'you do not have to',
        "you don't have to",
        'you do not need to',
        "you don't need to",
        'keep your secret',
        'keep your secrets',
        'you can keep your secret',
        'you can keep your secrets',
        'you owe me no secrets',
        'you do not owe me any secrets',
        "you don't owe me any secrets",
        'you owe me nothing',
        'you do not owe me anything',
        "you don't owe me anything",
        'i do not want to know your secrets',
        "i don't want to know your secrets",
        'tell me when you are ready',
        "tell me when you're ready",
      ],
    )
  ) {
    respectful =
      addSignal(
        respectful,
        0.9,
      )
  }

  /*
   * Giving somebody control over whether
   * they answer is also respectful.
   */

  if (
    matchesAny(
      lower,
      [
        /\bif you want to\b/,
        /\bif you wish\b/,
        /\bonly if you want\b/,
        /\bonly if you are comfortable\b/,
        /\bwhenever you are ready\b/,
      ],
    )
  ) {
    respectful =
      addSignal(
        respectful,
        0.7,
      )
  }

  /*
   * ================================================================
   * FLIRTATION / ATTRACTION
   * ================================================================
   */

  if (
    containsAny(
      lower,
      [
        'beautiful',
        'stunning',
        'gorgeous',
        'handsome',
        'attractive',
        'charming',
        'alluring',
        'captivating',
        'mesmerizing',
        'mesmerising',
        'irresistible',
        'you intrigue me',
        'you fascinate me',
        'drawn to you',
        'attracted to you',
        'kiss your hand',
        'kiss her hand',
        'kiss his hand',
      ],
    )
  ) {
    flirtatious =
      addSignal(
        flirtatious,
        0.75,
      )
  }

  /*
   * Broader compliment patterns.
   */

  if (
    matchesAny(
      lower,
      [
        /\byou (?:are|look|seem) (?:so |very |rather |too )?(?:beautiful|stunning|gorgeous|handsome|attractive|charming)\b/,
        /\bi (?:find|think) you (?:are )?(?:beautiful|stunning|gorgeous|attractive|charming)\b/,
        /\bi(?:'m| am) drawn to you\b/,
        /\bi cannot resist you\b/,
        /\bi can't resist you\b/,
        /\btoo beautiful to resist\b/,
      ],
    )
  ) {
    flirtatious =
      addSignal(
        flirtatious,
        0.25,
      )
  }

  /*
   * ================================================================
   * ROMANTIC / EMOTIONAL INTEREST
   * ================================================================
   */

  if (
    containsAny(
      lower,
      [
        'i love you',
        'i adore you',
        'i want to be with you',
        'i want us to be together',
        'i want to marry you',
        'marry me',
        'future wife',
        'future husband',
        'our future together',
        'forever with you',
        'my heart belongs to you',
        'i have feelings for you',
        'i am falling for you',
        "i'm falling for you",
      ],
    )
  ) {
    romantic =
      addSignal(
        romantic,
        1,
      )
  }

  /*
   * Emotional exploration can be romantic
   * without being a declaration of love.
   *
   * Examples:
   * "What does your heart tell you?"
   * "How do you feel about us?"
   */

  if (
    matchesAny(
      lower,
      [
        /\bwhat does your heart tell you\b/,
        /\bwhat does your heart say\b/,
        /\bhow do you feel about me\b/,
        /\bhow do you feel about us\b/,
        /\bwhat do you feel for me\b/,
        /\bdo you have feelings for me\b/,
        /\bcould there be something between us\b/,
        /\bwhere do you see this going\b/,
        /\bwhat are we becoming\b/,
        /\bour relationship\b/,
        /\bour connection\b/,
        /\bour bond\b/,
      ],
    )
  ) {
    romantic =
      addSignal(
        romantic,
        0.6,
      )
  }

  /*
   * Flirtation + emotional language can
   * imply mild romantic interest.
   */

  if (
    flirtatious >= 0.5 &&
    containsAny(
      lower,
      [
        'heart',
        'feel',
        'feelings',
        'connection',
        'bond',
        'together',
        'future',
      ],
    )
  ) {
    romantic =
      addSignal(
        romantic,
        0.35,
      )
  }

  /*
   * ================================================================
   * VULNERABILITY
   * ================================================================
   */

  if (
    containsAny(
      lower,
      [
        'i am afraid',
        "i'm afraid",
        'i am scared',
        "i'm scared",
        'i trust you with this',
        'i have never told anyone',
        "i've never told anyone",
        'this is difficult for me',
        'this is hard for me',
        'i feel vulnerable',
        'i need you',
        'i am worried',
        "i'm worried",
      ],
    )
  ) {
    vulnerable =
      addSignal(
        vulnerable,
        0.8,
      )
  }

  if (
    matchesAny(
      lower,
      [
        /\bi feel (?:lost|alone|hurt|afraid|scared|uncertain|confused)\b/,
        /\bi(?:'m| am) not sure how to say this\b/,
        /\bi have something difficult to tell you\b/,
      ],
    )
  ) {
    vulnerable =
      addSignal(
        vulnerable,
        0.7,
      )
  }

  /*
   * ================================================================
   * LOYALTY / COMMITMENT
   * ================================================================
   */

  if (
    containsAny(
      lower,
      [
        'i will not leave you',
        "i won't leave you",
        'i will stand beside you',
        "i'll stand beside you",
        'i will protect you',
        "i'll protect you",
        'you have my word',
        'i promise',
        'i will keep my word',
        "i'll keep my word",
        'i will not betray you',
        "i won't betray you",
      ],
    )
  ) {
    loyal =
      addSignal(
        loyal,
        0.9,
      )
  }

  /*
   * ================================================================
   * PLAYFULNESS
   * ================================================================
   */

  if (
    containsAny(
      lower,
      [
        'i smirk',
        'i grin',
        'i tease',
        'just teasing',
        'i wink',
        'perhaps',
        'maybe',
        'who knows',
      ],
    )
  ) {
    playful =
      addSignal(
        playful,
        0.4,
      )
  }

  if (
    matchesAny(
      lower,
      [
        /\bi say playfully\b/,
        /\bi say teasingly\b/,
        /\bi joke\b/,
        /\bwith a grin\b/,
        /\bwith a smirk\b/,
        /\bwith a wink\b/,
      ],
    )
  ) {
    playful =
      addSignal(
        playful,
        0.5,
      )
  }

  /*
   * ================================================================
   * SOCIAL INVITATION
   * ================================================================
   */

  if (
    containsAny(
      lower,
      [
        'have dinner',
        'have a meal',
        'over a meal',
        'over dinner',
        'over drinks',
        'over a drink',
        'have a drink',
        'some whiskey',
        'some wine',
        'join me',
        'come with me',
        'walk with me',
        'spend some time',
        'talk somewhere private',
      ],
    )
  ) {
    socialInvitation =
      addSignal(
        socialInvitation,
        0.8,
      )
  }

  if (
    matchesAny(
      lower,
      [
        /\bwould you like to (?:join|come|walk|sit|eat|drink|talk)\b/,
        /\bshall we (?:walk|sit|eat|drink|talk|go)\b/,
        /\bperhaps we should (?:walk|sit|eat|drink|talk|go|discuss)\b/,
        /\bmaybe we should (?:walk|sit|eat|drink|talk|go|discuss)\b/,
      ],
    )
  ) {
    socialInvitation =
      addSignal(
        socialInvitation,
        0.8,
      )
  }

  /*
   * ================================================================
   * RUDENESS
   * ================================================================
   */

  if (
    containsAny(
      lower,
      [
        'shut up',
        'idiot',
        'stupid',
        'pathetic',
        'useless',
        'annoying',
        'you disgust me',
      ],
    )
  ) {
    rude =
      addSignal(
        rude,
        0.9,
      )
  }

  /*
   * ================================================================
   * PRESSURE / COERCIVE LANGUAGE
   * ================================================================
   */

  if (
    containsAny(
      lower,
      [
        'you have to',
        'you must',
        'do it now',
        'you owe me',
        'prove you love me',
        'if you loved me',
        'you do not have a choice',
        "you don't have a choice",
        'you have no choice',
      ],
    )
  ) {
    pressuring =
      addSignal(
        pressuring,
        1,
      )
  }

  /*
   * Important distinction:
   *
   * "you owe me no secrets"
   *
   * must NOT be treated like:
   *
   * "you owe me your secrets"
   */

  if (
    containsAny(
      lower,
      [
        'you owe me no secrets',
        'you do not owe me any secrets',
        "you don't owe me any secrets",
        'you owe me nothing',
        'you do not owe me anything',
        "you don't owe me anything",
      ],
    )
  ) {
    pressuring = 0

    respectful =
      addSignal(
        respectful,
        0.9,
      )
  }

  /*
   * ================================================================
   * DISHONESTY
   * ================================================================
   */

  if (
    containsAny(
      lower,
      [
        'i lied',
        'i was lying',
        'i deceived you',
        'i tricked you',
        'i was dishonest',
      ],
    )
  ) {
    dishonest =
      addSignal(
        dishonest,
        1,
      )
  }

  /*
   * ================================================================
   * HOSTILITY
   * ================================================================
   */

  if (
    containsAny(
      lower,
      [
        'i hate you',
        'i despise you',
        'leave me alone',
        'i never want to see you again',
        'get away from me',
      ],
    )
  ) {
    hostile =
      addSignal(
        hostile,
        1,
      )
  }

  return {
    supportive:
      clampSignal(
        supportive,
      ),

    respectful:
      clampSignal(
        respectful,
      ),

    flirtatious:
      clampSignal(
        flirtatious,
      ),

    romantic:
      clampSignal(
        romantic,
      ),

    vulnerable:
      clampSignal(
        vulnerable,
      ),

    loyal:
      clampSignal(
        loyal,
      ),

    playful:
      clampSignal(
        playful,
      ),

    socialInvitation:
      clampSignal(
        socialInvitation,
      ),

    rude:
      clampSignal(
        rude,
      ),

    pressuring:
      clampSignal(
        pressuring,
      ),

    dishonest:
      clampSignal(
        dishonest,
      ),

    hostile:
      clampSignal(
        hostile,
      ),
  }
}