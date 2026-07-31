(() => {
    const detail = document.getElementById("training-detail");
    const breadcrumb = document.getElementById("breadcrumb-current");
    const id = new URLSearchParams(window.location.search).get("id");

    const renderList = items => items.map(item => `<li>${item}</li>`).join("");

    const renderReferences = training => {
        if (!training.references?.length) {
            return "";
        }

        return `
            <section class="detail-section references-section">
                <h2>근거와 참고 자료</h2>
                ${training.evidenceNote ? `<p class="evidence-note">${training.evidenceNote}</p>` : ""}
                <ol class="reference-list">
                    ${training.references.map(reference => `
                        <li>
                            <p class="reference-citation">
                                ${reference.authors}.
                                <a href="${reference.url}" target="_blank" rel="noopener noreferrer">${reference.title}</a>.
                                <em>${reference.journal}</em> (${reference.year}).
                                ${reference.doi ? `<span>DOI: ${reference.doi}</span>` : ""}
                            </p>
                            <p class="reference-supports"><strong>이 글에서 참고한 내용</strong>${reference.supports}</p>
                        </li>
                    `).join("")}
                </ol>
            </section>
        `;
    };

    const renderArticleSection = section => `
        <section class="article-section">
            <h2>${section.title}</h2>
            ${section.formula ? `<p class="article-formula">${section.formula}</p>` : ""}
            ${(section.paragraphs || []).map(paragraph => `<p>${paragraph}</p>`).join("")}
            ${section.image ? `
                <figure class="article-inline-figure">
                    <img src="${section.image}" alt="${section.imageAlt}" loading="lazy" decoding="async">
                    ${section.imageCaption ? `<figcaption>${section.imageCaption}</figcaption>` : ""}
                </figure>
            ` : ""}
            ${section.items ? `
                <div class="article-item-list">
                    ${section.items.map(item => `
                        <article class="article-item">
                            <h3>${item.heading}</h3>
                            <p>${item.text}</p>
                        </article>
                    `).join("")}
                </div>
            ` : ""}
            ${section.steps ? `<ol class="article-steps">${renderList(section.steps)}</ol>` : ""}
            ${section.callout ? `<aside class="article-callout">${section.callout}</aside>` : ""}
        </section>
    `;

    const renderArticle = training => {
        document.title = `${training.title} | MODU RUNNING`;
        document.querySelector('meta[name="description"]').content = training.summary;
        breadcrumb.textContent = training.title;

        detail.classList.add("article-detail");
        detail.innerHTML = `
            <header class="article-head">
                <div class="article-head-copy">
                    <p class="detail-category">${training.category}</p>
                    <p class="article-source">${training.sourceLabel}</p>
                    <h1 class="detail-title">${training.title}</h1>
                    <p class="detail-summary">${training.summary}</p>
                    <div class="detail-meta">
                        <span>작성 ${training.author}</span>
                        <span>${training.level}</span>
                        <span>${training.duration}</span>
                        <span>원문 작성 ${training.updated}</span>
                    </div>
                </div>
                <figure class="article-hero-figure">
                    <img src="${training.heroImage}" alt="${training.heroAlt}">
                    ${training.heroCredit ? `<figcaption>${training.heroCredit}</figcaption>` : ""}
                </figure>
            </header>
            <div class="article-layout">
                <article class="article-body">
                    ${(training.articleSections || []).map(renderArticleSection).join("")}
                </article>
                <aside class="article-aside">
                    <div class="article-aside-inner">
                        <section>
                            <h2>이 글에 대해</h2>
                            <div class="article-author">
                                <img src="${training.authorImage}" alt="${training.authorImageAlt}">
                                <strong>${training.author}</strong>
                            </div>
                            <p>${training.authorNote}</p>
                        </section>
                        ${training.keyPoints ? `
                            <section>
                                <h2>먼저 기억할 것</h2>
                                <ul>${renderList(training.keyPoints)}</ul>
                            </section>
                        ` : ""}
                        ${training.glossary?.length ? `
                            <section>
                                <h2>용어 주석</h2>
                                <dl class="article-glossary">
                                    ${training.glossary.map(item => `
                                        <div>
                                            <dt>${item.term}<span>${item.english}</span></dt>
                                            <dd>${item.definition}</dd>
                                        </div>
                                    `).join("")}
                                </dl>
                            </section>
                        ` : ""}
                        <section>
                            <h2>핵심 키워드</h2>
                            <div class="detail-tags">
                                ${training.purposeTags.map(tag => `<span class="tag"># ${tag}</span>`).join("")}
                            </div>
                        </section>
                    </div>
                </aside>
            </div>
        `;
    };

    const renderPaceTables = training => {
        if (!training.paceTable || !training.splitTable) {
            return "";
        }

        const paceColumns = training.paceColumns || [
            { key: "group", label: "그룹", header: true },
            { key: "goal", label: "목표 마라톤" },
            { key: "fast", label: "600m 질주", emphasis: true },
            { key: "pace", label: "1km 환산" },
            { key: "recovery", label: "200m 조깅" },
            { key: "total", label: "1세트" }
        ];
        const splitColumns = training.splitColumns || [
            { key: "group", label: "그룹", header: true },
            { key: "m200", label: "200m" },
            { key: "m400", label: "400m" },
            { key: "m600", label: "600m", emphasis: true }
        ];
        const renderTableHead = columns => columns.map(column => `<th>${column.label}</th>`).join("");
        const renderTableRow = (row, columns) => columns.map(column => {
            const content = column.emphasis ? `<strong>${row[column.key]}</strong>` : row[column.key];
            const tag = column.header ? "th" : "td";
            return `<${tag} data-label="${column.label}">${content}</${tag}>`;
        }).join("");

        return `
            <section class="detail-section pace-section">
                <h2>${training.paceTableTitle || "그룹별 메인 페이스"}</h2>
                <div class="table-scroll">
                    <table class="pace-table">
                        <thead>
                            <tr>${renderTableHead(paceColumns)}</tr>
                        </thead>
                        <tbody>
                            ${training.paceTable.map(row => `<tr>${renderTableRow(row, paceColumns)}</tr>`).join("")}
                        </tbody>
                    </table>
                </div>
            </section>
            <section class="detail-section split-section">
                <h2>${training.splitTableTitle || "트랙 스플릿 체크"}</h2>
                <div class="table-scroll">
                    <table class="pace-table compact">
                        <thead>
                            <tr>${renderTableHead(splitColumns)}</tr>
                        </thead>
                        <tbody>
                            ${training.splitTable.map(row => `<tr>${renderTableRow(row, splitColumns)}</tr>`).join("")}
                        </tbody>
                    </table>
                </div>
                <ul>${renderList(training.splitGuide)}</ul>
            </section>
        `;
    };

    const renderDetail = training => {
        if (training.type === "article") {
            renderArticle(training);
            return;
        }

        document.title = `${training.title} | MODU RUNNING`;
        document.querySelector('meta[name="description"]').content = training.summary;
        breadcrumb.textContent = training.title;

        detail.innerHTML = `
            <header class="detail-head">
                <p class="detail-category">${training.category}</p>
                <h1 class="detail-title">${training.title}</h1>
                <p class="detail-summary">${training.summary}</p>
                <div class="detail-meta">
                    <span>난이도 ${training.level}</span>
                    <span>${training.duration}</span>
                    ${training.designer ? `<span>훈련 디자인 ${training.designer}</span>` : ""}
                    <span>업데이트 ${training.updated}</span>
                </div>
            </header>
            <div class="detail-content">
                <div class="detail-main">
                    <section class="detail-section workout-section">
                        <h2>훈련 구성</h2>
                        <ol class="workout-steps">${renderList(training.structure)}</ol>
                    </section>
                    ${renderPaceTables(training)}
                    ${renderReferences(training)}
                </div>
                <aside class="detail-sidebar" aria-label="훈련 핵심 안내">
                    <div class="detail-sidebar-inner">
                    <section class="detail-section sidebar-section purpose-note">
                        <h2>훈련 목적</h2>
                        <p>${training.purpose}</p>
                        <div class="detail-tags">
                            ${training.purposeTags.map(tag => `<span class="tag"># ${tag}</span>`).join("")}
                        </div>
                    </section>
                    <section class="detail-section sidebar-section target-note">
                        <h2>추천 대상</h2>
                        <p>${training.recommendedFor}</p>
                    </section>
                    <section class="detail-section sidebar-section intensity-note">
                        <h2>강도 기준</h2>
                        <p>${training.intensity}</p>
                    </section>
                    ${training.termNotes ? `
                        <section class="detail-section sidebar-section terms-note">
                            <h2>용어 주석</h2>
                            <dl class="term-list">
                                ${training.termNotes.map(term => `
                                    <div>
                                        <dt>${term.term}</dt>
                                        <dd>${term.description}</dd>
                                    </div>
                                `).join("")}
                            </dl>
                        </section>
                    ` : ""}
                    <section class="detail-section sidebar-section mistakes-note">
                        <h2>자주 하는 실수</h2>
                        <ul class="compact-list">${renderList(training.mistakes)}</ul>
                    </section>
                    <section class="detail-section sidebar-section coach-note">
                        <h2>코치 노트</h2>
                        <p>${training.coachNote}</p>
                    </section>
                    <section class="detail-section sidebar-section caution-note">
                        <h2>주의사항</h2>
                        <p>${training.caution}</p>
                    </section>
                    </div>
                </aside>
            </div>
        `;
    };

    if (!id) {
        breadcrumb.textContent = "찾을 수 없음";
        detail.innerHTML = '<p class="empty-state">선택한 훈련 노트를 찾을 수 없습니다.</p>';
        return;
    }

    fetch("data/training.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("훈련 데이터를 불러오지 못했습니다.");
            }
            return response.json();
        })
        .then(trainings => {
            const training = trainings.find(item => item.id === id);
            if (!training) {
                throw new Error("선택한 훈련이 없습니다.");
            }
            renderDetail(training);
        })
        .catch(() => {
            breadcrumb.textContent = "찾을 수 없음";
            detail.innerHTML = '<p class="empty-state">선택한 훈련 노트를 불러오지 못했습니다.</p>';
        });
})();
