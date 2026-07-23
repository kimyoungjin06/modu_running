(() => {
    const grid = document.getElementById("training-grid");
    const filters = document.getElementById("training-filters");
    let trainings = [];
    let activeCategory = "전체";

    const createCard = training => {
        const card = document.createElement("a");
        card.className = "training-card";
        card.href = `training-detail.html?id=${encodeURIComponent(training.id)}`;
        card.innerHTML = `
            <p class="card-category">${training.category}</p>
            <h2>${training.title}</h2>
            <p class="summary">${training.summary}</p>
            <div class="card-meta">
                <span>${training.level}</span>
                <span>${training.duration}</span>
                ${training.purposeTags.map(tag => `<span>${tag}</span>`).join("")}
            </div>
            <span class="card-arrow" aria-hidden="true">↗</span>
        `;
        return card;
    };

    const renderCards = () => {
        const visible = activeCategory === "전체"
            ? trainings
            : trainings.filter(training => training.category === activeCategory);

        grid.innerHTML = "";
        if (!visible.length) {
            grid.innerHTML = '<p class="empty-state">아직 등록된 훈련 노트가 없습니다.</p>';
            return;
        }

        visible.forEach(training => grid.appendChild(createCard(training)));
    };

    const renderFilters = () => {
        const categories = ["전체", ...new Set(trainings.map(training => training.category))];
        filters.innerHTML = "";

        categories.forEach(category => {
            const button = document.createElement("button");
            button.className = `filter-button${category === activeCategory ? " is-active" : ""}`;
            button.type = "button";
            button.textContent = category;
            button.setAttribute("aria-pressed", String(category === activeCategory));
            button.addEventListener("click", () => {
                activeCategory = category;
                filters.querySelectorAll("button").forEach(item => {
                    const isActive = item === button;
                    item.classList.toggle("is-active", isActive);
                    item.setAttribute("aria-pressed", String(isActive));
                });
                renderCards();
            });
            filters.appendChild(button);
        });
    };

    fetch("data/training.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("훈련 데이터를 불러오지 못했습니다.");
            }
            return response.json();
        })
        .then(data => {
            trainings = data;
            renderFilters();
            renderCards();
        })
        .catch(() => {
            grid.innerHTML = '<p class="empty-state">훈련 노트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
        });
})();
