/**
 * @typedef {'food'|'medical'|'shelter'|'donation'|'urgent'|'water'|'rescue'|'power'|'transport'|'volunteer'|'update'} HelpType
 */

/**
 * @typedef {Object} NeededItem
 * @property {string} name
 * @property {number} qtyNeeded
 * @property {number} qtyPledged
 */

/**
 * @typedef {'open'|'fulfilled'} PostStatus
 */

/**
 * @typedef {Object} Post
 * @property {string} id
 * @property {string} userId
 * @property {string} userName
 * @property {string=} userPhoto
 * @property {'situation'|'request'} type
 * @property {string} caption
 * @property {HelpType} helpType
 * @property {0|1} urgency
 * @property {string} photoUrl
 * @property {{ lat: number; lng: number; geohash?: string }} location
 * @property {number=} distanceKm
 * @property {number=} targetAmount
 * @property {number} currentAmount
 * @property {NeededItem[]=} neededItems
 * @property {number} upvoteCount
 * @property {Record<string, true>=} voters
 * @property {number} priorityScore
 * @property {PostStatus} status
 * @property {string|number} createdAt
 * @property {boolean=} verified
 */

export {}

