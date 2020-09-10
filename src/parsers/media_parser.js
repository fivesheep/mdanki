const path = require('path');
const axios = require('axios');
const fs = require('fs');

const BaseParser = require('./base_parser');
const Media = require('../models/media');
const {
  getExtensionFromUrl,
  replaceAsync,
} = require('../utils');

/**
 * @typedef {import('../models/media').Media} Media
 * @typedef {import('./base_parser').BaseParser} BaseParser
 */

class MediaParser extends BaseParser {
  constructor(mediaList, options = {}) {
    super(options);
    this.mediaList = mediaList;
    this.srcRe = new RegExp('src="([^"]*?)"', 'g');
  }

  /**
   * Prepare media from card's side
   * @param {string} side
   * @param {[Media]} mediaList
   */
  parse(side) {
    return replaceAsync(side, this.srcRe, this.replacer);
  }

  async replacer(match, p1) {
    let data;
    let fileExt;

    if (p1.startsWith('http')) {
      const resp = await axios.get(p1);
      data = resp.data;
      fileExt = getExtensionFromUrl(p1);
    } else {
      const filePath = path.resolve(path.dirname(this.source), p1);
      fileExt = path.extname(filePath);
      data = fs.readFileSync(filePath);
    }

    const media = new Media(data);
    media.fileName = `${media.checksum}${fileExt}`;

    this.addMedia(media);

    return `src="${media.fileName}"`;
  }

  addMedia(media) {
    const hasMedia = this.mediaList.some((item) => item.checksum === media.checksum);
    if (hasMedia) { return; }

    this.mediaList.push(media);
  }
}

module.exports = MediaParser;
