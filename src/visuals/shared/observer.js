const hasIntersectionObserver = () => "IntersectionObserver" in globalThis;

export const toggleBodyClassByVisibility = (elements, className, options) => {
	if (!elements.length || !hasIntersectionObserver()) {
		return null;
	}

	const activeElements = new Set();
	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				activeElements.add(entry.target);
			} else {
				activeElements.delete(entry.target);
			}
		});

		globalThis.document?.body?.classList.toggle(className, activeElements.size > 0);
	}, options);

	elements.forEach((element) => observer.observe(element));
	return observer;
};

export const observeOnceVisible = (elements, onVisible, options) => {
	if (!elements.length) {
		return null;
	}

	if (!hasIntersectionObserver()) {
		elements.forEach((element) => onVisible(element));
		return null;
	}

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) {
				return;
			}

			onVisible(entry.target, observer);
			observer.unobserve(entry.target);
		});
	}, options);

	elements.forEach((element) => observer.observe(element));
	return observer;
};
