(() => {
    const detail = document.getElementById("training-detail");
    const breadcrumb = document.getElementById("breadcrumb-current");
    const id = new URLSearchParams(window.location.search).get("id");

    const renderList = items => items.map(item => `<li>${item}</li>`).join("");

    const renderPaceTables = training => {
        if (!training.paceTable || !training.splitTable) {
            return "";
        }

        return `
            <section class="detail-section">
                <h2>그룹별 메인 페이스</h2>
                <div class="table-scroll">
                    <table class="pace-table">
                        <thead>
                            <tr>
                                <th>그룹</th>
                                <th>목표 마라톤</th>
                                <th>600m 질주</th>
                                <th>1km 환산</th>
                                <th>200m 조깅</th>
                                <th>1세트</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${training.paceTable.map(row => `
                                <tr>
                                    <th>${row.group}</th>
                                    <td>${row.goal}</td>
                                    <td><strong>${row.fast}</strong></td>
                                    <td>${row.pace}</td>
                                    <td>${row.recovery}</td>
                                    <td>${row.total}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </section>
            <section class="detail-section">
                <h2>트랙 스플릿 체크</h2>
                <div class="table-scroll">
                    <table class="pace-table compact">
                        <thead>
                            <tr>
                                <th>그룹</th>
                                <th>200m</th>
                                <th>400m</th>
                                <th>600m</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${training.splitTable.map(row => `
                                <tr>
                                    <th>${row.group}</th>
                                    <td>${row.m200}</td>
                                    <td>${row.m400}</td>
                                    <td><strong>${row.m600}</strong></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
                <ul>${renderList(training.splitGuide)}</ul>
            </section>
        `;
    };

    const renderDetail = training => {
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
                    <span>업데이트 ${training.updated}</span>
                </div>
            </header>
            <div class="detail-content">
                <div>
                    <section class="detail-section">
                        <h2>이 훈련의 목적</h2>
                        <p>${training.purpose}</p>
                        <div class="detail-tags">
                            ${training.purposeTags.map(tag => `<span class="tag"># ${tag}</span>`).join("")}
                        </div>
                    </section>
                    <section class="detail-section">
                        <h2>이렇게 진행해요</h2>
                        <ol class="workout-steps">${renderList(training.structure)}</ol>
                    </section>
                    <section class="detail-section">
                        <h2>강도 기준</h2>
                        <p>${training.intensity}</p>
                    </section>
                    ${renderPaceTables(training)}
                    <section class="detail-section">
                        <h2>자주 하는 실수</h2>
                        <ul>${renderList(training.mistakes)}</ul>
                    </section>
                </div>
                <aside>
                    <section class="detail-section">
                        <h2>추천 대상</h2>
                        <p>${training.recommendedFor}</p>
                    </section>
                    <section class="detail-section coach-note">
                        <h2>코치 노트</h2>
                        <p>${training.coachNote}</p>
                    </section>
                    <section class="detail-section caution-note">
                        <h2>주의사항</h2>
                        <p>${training.caution}</p>
                    </section>
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
