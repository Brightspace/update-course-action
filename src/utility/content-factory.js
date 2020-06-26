'use strict';

module.exports = class ContentFactory {
	static createRichText(content, type) {
		return {
			Content: content,
			Type: type
		};
	}

	static createModule({ title, description, dueDate = null }) {
		return {
			Title: title,
			ShortTitle: title,
			Type: 0,
			ModuleStartDate: null,
			ModuleEndDate: null,
			ModuleDueDate: dueDate,
			IsHidden: false,
			IsLocked: false,
			Description: description
		};
	}

	static createTopic({ title, topicType = 1, dueDate = null, url, isHidden = false, isExempt = false }) {
		return {
			Title: title,
			ShortTitle: title,
			Type: 1,
			TopicType: topicType,
			StartDate: null,
			EndDate: null,
			DueDate: dueDate,
			Url: url,
			IsHidden: isHidden,
			IsLocked: false,
			IsExempt: isExempt
		};
	}
};
