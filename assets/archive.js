(() => {
    const grid = document.getElementById("archive-grid");
    const filters = document.getElementById("archive-filters");
    const videoGrid = document.getElementById("archive-video-grid");
    let records = [];
    let activeCategory = "전체";

    const renderRecord = record => {
        const article = document.createElement("article");
        article.className = "archive-card";
        article.innerHTML = `
            <figure class="archive-card-media">
                <img src="${record.image}" alt="${record.imageAlt}" loading="lazy" decoding="async">
                <span class="archive-status">${record.status}</span>
            </figure>
            <div class="archive-card-body">
                <div class="archive-card-meta">
                    <span>${record.category}</span>
                    <span>${record.period}</span>
                </div>
                <h3>${record.title}</h3>
                <p class="archive-summary">${record.summary}</p>
                <dl class="archive-facts">
                    <div><dt>당시 일정</dt><dd>${record.schedule}</dd></div>
                    <div><dt>장소</dt><dd>${record.location}</dd></div>
                </dl>
                <details class="archive-story">
                    <summary>자세히 보기</summary>
                    <div class="archive-story-copy">
                        ${record.story.map(paragraph => `<p>${paragraph}</p>`).join("")}
                        <div class="archive-tags">
                            ${record.tags.map(tag => `<span># ${tag}</span>`).join("")}
                        </div>
                        <a href="index.html#schedule">현재 일정 보기 →</a>
                    </div>
                </details>
            </div>
        `;
        return article;
    };

    const renderRecords = () => {
        const visibleRecords = activeCategory === "전체"
            ? records
            : records.filter(record => record.category === activeCategory);

        grid.innerHTML = "";
        if (!visibleRecords.length) {
            grid.innerHTML = '<p class="archive-message">아직 등록된 활동이 없습니다.</p>';
            return;
        }

        visibleRecords.forEach(record => grid.appendChild(renderRecord(record)));
    };

    const renderFilters = () => {
        const categories = ["전체", ...new Set(records.map(record => record.category))];
        filters.innerHTML = "";

        categories.forEach(category => {
            const button = document.createElement("button");
            const isActive = category === activeCategory;
            button.className = `archive-filter${isActive ? " is-active" : ""}`;
            button.type = "button";
            button.textContent = category;
            button.setAttribute("aria-pressed", String(isActive));
            button.addEventListener("click", () => {
                activeCategory = category;
                filters.querySelectorAll("button").forEach(filter => {
                    const filterIsActive = filter === button;
                    filter.classList.toggle("is-active", filterIsActive);
                    filter.setAttribute("aria-pressed", String(filterIsActive));
                });
                renderRecords();
            });
            filters.appendChild(button);
        });
    };

    const renderVideos = media => {
        if (!media.length) {
            videoGrid.innerHTML = '<p class="archive-message">아직 등록된 활동 영상이 없습니다.</p>';
            return;
        }
        videoGrid.innerHTML = media.map(item => `
            <article class="archive-video-card">
                <div class="archive-reel-frame">
                    <iframe
                        src="${item.embedUrl}"
                        title="${item.title} Instagram Reel"
                        loading="lazy"
                        allowfullscreen>
                    </iframe>
                </div>
                <div class="archive-video-copy">
                    <p>${item.platform}</p>
                    <h3>${item.title}</h3>
                    <span>${item.description}</span>
                    <div class="archive-video-tags">${item.tags.map(tag => `<b>#${tag}</b>`).join("")}</div>
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer">Instagram에서 보기 ↗</a>
                </div>
            </article>
        `).join("");
    };

    Promise.all([
        fetch("data/archive.json"),
        fetch("data/archive-media.json")
    ])
        .then(async responses => {
            if (responses.some(response => !response.ok)) {
                throw new Error("아카이브 데이터를 불러오지 못했습니다.");
            }
            return Promise.all(responses.map(response => response.json()));
        })
        .then(([archiveRecords, media]) => {
            records = archiveRecords;
            renderFilters();
            renderRecords();
            renderVideos(media);
        })
        .catch(() => {
            grid.innerHTML = '<p class="archive-message">활동을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
            videoGrid.innerHTML = '<p class="archive-message">활동 영상을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
        });
})();
