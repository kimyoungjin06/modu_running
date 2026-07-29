(() => {
    const form = document.getElementById("pace-form");
    const distanceInput = document.getElementById("distance");
    const timeFields = document.getElementById("target-time-fields");
    const paceFields = document.getElementById("target-pace-fields");
    const hoursInput = document.getElementById("target-hours");
    const minutesInput = document.getElementById("target-minutes");
    const secondsInput = document.getElementById("target-seconds");
    const paceMinutesInput = document.getElementById("pace-minutes");
    const paceSecondsInput = document.getElementById("pace-seconds");
    const errorElement = document.getElementById("form-error");
    const resultPace = document.getElementById("result-pace");
    const resultTime = document.getElementById("result-time");
    const resultSpeed = document.getElementById("result-speed");
    const resultDistance = document.getElementById("result-distance");
    const splitGrid = document.getElementById("split-grid");
    const predictionGrid = document.getElementById("prediction-grid");
    const copyButton = document.getElementById("copy-result");
    const shareButton = document.getElementById("share-result");
    const actionStatus = document.getElementById("action-status");
    const lapStrategy = document.getElementById("lap-strategy");
    const lapDescription = document.getElementById("lap-description");
    const lapTableBody = document.getElementById("lap-table-body");
    const intervalPace = document.getElementById("interval-pace");
    const repeatDistanceInput = document.getElementById("repeat-distance");
    const repeatCountInput = document.getElementById("repeat-count");
    const recoveryDistanceInput = document.getElementById("recovery-distance");
    const recoveryMinutesInput = document.getElementById("recovery-minutes");
    const recoverySecondsInput = document.getElementById("recovery-seconds");
    const intervalSummary = document.getElementById("interval-summary");
    const trainingNotice = document.getElementById("training-notice");
    const copyNoticeButton = document.getElementById("copy-notice");
    const noticeStatus = document.getElementById("notice-status");
    const racePlanPace = document.getElementById("race-plan-pace");
    const raceSplitBody = document.getElementById("race-split-body");
    const gelIntervalInput = document.getElementById("gel-interval");
    const firstGelInput = document.getElementById("first-gel");
    const fuelingList = document.getElementById("fueling-list");
    const raceStartTimeInput = document.getElementById("race-start-time");
    const raceTimeline = document.getElementById("race-timeline");
    const quickDistanceButtons = Array.from(document.querySelectorAll("[data-distance]"));
    const modeInputs = Array.from(document.querySelectorAll('input[name="mode"]'));

    const splitDistances = [
        { label: "200m", km: 0.2 },
        { label: "400m", km: 0.4 },
        { label: "600m", km: 0.6 },
        { label: "800m", km: 0.8 },
        { label: "1km", km: 1 }
    ];

    const raceDistances = [
        { label: "10K", km: 10 },
        { label: "하프", km: 21.0975 },
        { label: "풀", km: 42.195 }
    ];

    let currentResult = null;

    const getMode = () => modeInputs.find(input => input.checked)?.value || "time";
    const toNumber = input => Number(input.value || 0);
    const clampRound = value => Math.max(0, Math.round(value));

    const formatDuration = (totalSeconds, showHoursWhenZero = false) => {
        const rounded = clampRound(totalSeconds);
        const hours = Math.floor(rounded / 3600);
        const minutes = Math.floor((rounded % 3600) / 60);
        const seconds = rounded % 60;

        if (hours > 0 || showHoursWhenZero) {
            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        }
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
    };

    const formatPace = paceSeconds => {
        const rounded = clampRound(paceSeconds);
        return `${Math.floor(rounded / 60)}′${String(rounded % 60).padStart(2, "0")}″`;
    };

    const formatDistance = distance => {
        if (Number.isInteger(distance)) {
            return `${distance} km`;
        }
        return `${distance.toFixed(distance < 10 ? 3 : 2).replace(/0+$/, "").replace(/\.$/, "")} km`;
    };

    const getValues = () => {
        const mode = getMode();
        const distance = toNumber(distanceInput);
        let totalSeconds;
        let paceSeconds;

        if (!Number.isFinite(distance) || distance <= 0 || distance > 1000) {
            throw new Error("거리는 0.1km 이상 1,000km 이하로 입력해 주세요.");
        }

        if (mode === "time") {
            const hours = toNumber(hoursInput);
            const minutes = toNumber(minutesInput);
            const seconds = toNumber(secondsInput);
            if ([hours, minutes, seconds].some(value => !Number.isFinite(value) || value < 0)) {
                throw new Error("목표시간을 올바르게 입력해 주세요.");
            }
            if (minutes > 59 || seconds > 59) {
                throw new Error("분과 초는 0부터 59까지 입력해 주세요.");
            }
            totalSeconds = hours * 3600 + minutes * 60 + seconds;
            if (totalSeconds <= 0) {
                throw new Error("목표시간은 0초보다 커야 합니다.");
            }
            paceSeconds = totalSeconds / distance;
        } else {
            const paceMinutes = toNumber(paceMinutesInput);
            const paceSecondsPart = toNumber(paceSecondsInput);
            if ([paceMinutes, paceSecondsPart].some(value => !Number.isFinite(value) || value < 0)) {
                throw new Error("페이스를 올바르게 입력해 주세요.");
            }
            if (paceSecondsPart > 59) {
                throw new Error("페이스의 초는 0부터 59까지 입력해 주세요.");
            }
            paceSeconds = paceMinutes * 60 + paceSecondsPart;
            if (paceSeconds <= 0 || paceSeconds > 3600) {
                throw new Error("1km 페이스는 0초보다 크고 60분 이하여야 합니다.");
            }
            totalSeconds = paceSeconds * distance;
        }

        return { mode, distance, totalSeconds, paceSeconds };
    };

    const renderSplits = paceSeconds => {
        splitGrid.innerHTML = splitDistances.map(split => `
            <div class="split-item">
                <span>${split.label}</span>
                <strong>${formatDuration(paceSeconds * split.km)}</strong>
            </div>
        `).join("");
    };

    const renderPredictions = ({ distance, totalSeconds }) => {
        predictionGrid.innerHTML = raceDistances.map(race => {
            const predictedSeconds = totalSeconds * Math.pow(race.km / distance, 1.06);
            return `
                <div class="prediction-item">
                    <span>${race.label}</span>
                    <strong>${formatDuration(predictedSeconds, predictedSeconds >= 3600)}</strong>
                    <small>${formatPace(predictedSeconds / race.km)}/km</small>
                </div>
            `;
        }).join("");
    };

    const getLapSegments = distance => {
        const segments = [];
        let covered = 0;
        while (covered < distance - 0.00001) {
            const length = Math.min(1, distance - covered);
            covered += length;
            segments.push({ length, point: covered });
        }
        return segments;
    };

    const renderLapPlan = ({ distance, totalSeconds, paceSeconds }) => {
        const segments = getLapSegments(distance);
        const isNegative = lapStrategy.value === "negative";
        const rawFactors = segments.map((segment, index) => {
            if (!isNegative || segments.length === 1) return 1;
            return 1.03 - (0.06 * index / (segments.length - 1));
        });
        const weightedFactor = rawFactors.reduce((sum, factor, index) => sum + factor * segments[index].length, 0);
        const normalization = distance / weightedFactor;
        let cumulative = 0;

        lapDescription.textContent = isNegative
            ? "초반은 목표보다 약 3% 여유 있게, 후반은 약 3% 빠르게 달리며 총 목표시간을 맞춥니다."
            : "처음부터 끝까지 같은 페이스를 유지하는 계획입니다.";
        lapTableBody.innerHTML = segments.map((segment, index) => {
            const segmentPace = paceSeconds * rawFactors[index] * normalization;
            const segmentTime = segmentPace * segment.length;
            cumulative += segmentTime;
            const pointLabel = segment.point === distance && !Number.isInteger(distance)
                ? `${distance.toFixed(3).replace(/0+$/, "")}km`
                : `${Math.round(segment.point)}km`;
            return `<tr>
                <th scope="row">${pointLabel}</th>
                <td>${formatPace(segmentPace)} <small>${formatDuration(segmentTime)}</small></td>
                <td>${formatDuration(index === segments.length - 1 ? totalSeconds : cumulative, totalSeconds >= 3600)}</td>
            </tr>`;
        }).join("");
    };

    const getIntervalValues = () => {
        const repeatDistance = Math.max(100, Math.min(5000, toNumber(repeatDistanceInput)));
        const repeatCount = Math.max(1, Math.min(50, Math.round(toNumber(repeatCountInput))));
        const recoveryDistance = Math.max(0, Math.min(3000, toNumber(recoveryDistanceInput)));
        const recoveryMinutes = Math.max(0, toNumber(recoveryMinutesInput));
        const recoverySeconds = Math.max(0, Math.min(59, toNumber(recoverySecondsInput)));
        return {
            repeatDistance,
            repeatCount,
            recoveryDistance,
            recoveryPace: recoveryMinutes * 60 + recoverySeconds
        };
    };

    const renderInterval = () => {
        if (!currentResult) return;
        const values = getIntervalValues();
        const recoveryCount = Math.max(0, values.repeatCount - 1);
        const repeatTime = currentResult.paceSeconds * values.repeatDistance / 1000;
        const fastDistance = values.repeatDistance * values.repeatCount / 1000;
        const recoveryTotalDistance = values.recoveryDistance * recoveryCount / 1000;
        const fastTime = repeatTime * values.repeatCount;
        const recoveryTime = values.recoveryPace * recoveryTotalDistance;
        const totalDistance = fastDistance + recoveryTotalDistance;
        const totalTime = fastTime + recoveryTime;

        intervalPace.textContent = `${formatPace(currentResult.paceSeconds)}/km`;
        intervalSummary.innerHTML = `
            <div><span>1회 질주</span><strong>${formatDuration(repeatTime)}</strong></div>
            <div><span>질주 거리</span><strong>${formatDistance(fastDistance)}</strong></div>
            <div><span>본운동 거리</span><strong>${formatDistance(totalDistance)}</strong></div>
            <div><span>예상 시간</span><strong>${formatDuration(totalTime, totalTime >= 3600)}</strong></div>
        `;
        trainingNotice.value = [
            "[MRC 인터벌 훈련]",
            `훈련: ${values.repeatDistance}m × ${values.repeatCount}회 / 회복 ${values.recoveryDistance}m`,
            `목표 페이스: ${formatPace(currentResult.paceSeconds)}/km`,
            `${values.repeatDistance}m 목표: ${formatDuration(repeatTime)}`,
            `회복 페이스: ${formatPace(values.recoveryPace)}/km`,
            `본운동 거리: ${formatDistance(totalDistance)}`,
            `예상 본운동 시간: ${formatDuration(totalTime, totalTime >= 3600)}`,
            "",
            "워밍업과 쿨다운은 별도로 충분히 진행합니다."
        ].join("\n");
    };

    const renderRaceSplits = result => {
        const step = 5;
        const points = [];
        for (let point = step; point < result.distance; point += step) {
            points.push(point);
        }
        points.push(result.distance);
        let previousPoint = 0;
        let previousTime = 0;
        racePlanPace.textContent = `${formatPace(result.paceSeconds)}/km`;
        raceSplitBody.innerHTML = points.map(point => {
            const cumulative = result.paceSeconds * point;
            const segmentTime = cumulative - previousTime;
            const segmentDistance = point - previousPoint;
            previousPoint = point;
            previousTime = cumulative;
            return `<tr>
                <th scope="row">${point === result.distance && !Number.isInteger(point) ? point.toFixed(3).replace(/0+$/, "") : point}km</th>
                <td>${formatDuration(segmentTime, segmentTime >= 3600)} <small>${segmentDistance.toFixed(3).replace(/\.?0+$/, "")}km</small></td>
                <td>${formatDuration(cumulative, cumulative >= 3600)}</td>
            </tr>`;
        }).join("");
    };

    const renderFueling = result => {
        const intervalMinutes = toNumber(gelIntervalInput);
        const firstMinutes = toNumber(firstGelInput);
        const totalMinutes = result.totalSeconds / 60;
        const moments = [];
        if (firstMinutes < totalMinutes - 10) {
            moments.push(firstMinutes);
        }
        for (let minute = firstMinutes + intervalMinutes; minute < totalMinutes - 10; minute += intervalMinutes) {
            moments.push(minute);
        }
        if (!moments.length) {
            fuelingList.innerHTML = `<li><strong>보급 없음</strong><span>10K는 레이스 중 젤보다 출발 전 식사와 급수 계획을 우선하세요.</span></li>`;
            return;
        }
        fuelingList.innerHTML = moments.map((minute, index) => {
            const distance = minute === 0 ? 0 : minute * 60 / result.paceSeconds;
            const label = minute === 0 ? "출발 10분 전" : `${minute}분 · 약 ${distance.toFixed(1)}km`;
            const note = index === 0 && firstMinutes === 0 ? "물과 함께 첫 젤" : `${index + 1}번째 젤 + 물`;
            return `<li><strong>${label}</strong><span>${note}</span></li>`;
        }).join("");
    };

    const minutesToClock = totalMinutes => {
        const dayMinutes = ((totalMinutes % 1440) + 1440) % 1440;
        const hours = Math.floor(dayMinutes / 60);
        const minutes = dayMinutes % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    };

    const renderRaceTimeline = () => {
        const [hours, minutes] = raceStartTimeInput.value.split(":").map(Number);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return;
        const start = hours * 60 + minutes;
        const events = [
            { offset: -210, title: "기상", note: "수분 상태와 몸 상태 확인" },
            { offset: -180, title: "아침 식사", note: "평소 검증한 탄수화물 중심 식사" },
            { offset: -100, title: "대회장 도착", note: "화장실·물품 보관 위치 확인" },
            { offset: -55, title: "워밍업 시작", note: "가벼운 조깅과 동적 스트레칭" },
            { offset: -25, title: "출발 블록 입장", note: "젤·시계·번호표 최종 점검" },
            { offset: -10, title: "집중", note: "초반 목표 페이스와 운영 전략 확인" },
            { offset: 0, title: "출발", note: "첫 구간은 계획보다 빠르지 않게" }
        ];
        raceTimeline.innerHTML = events.map(event => `
            <li><time>${minutesToClock(start + event.offset)}</time><div><strong>${event.title}</strong><span>${event.note}</span></div></li>
        `).join("");
    };

    const updateUrl = result => {
        const params = new URLSearchParams();
        params.set("mode", result.mode);
        params.set("distance", String(result.distance));
        if (result.mode === "time") {
            params.set("h", String(toNumber(hoursInput)));
            params.set("m", String(toNumber(minutesInput)));
            params.set("s", String(toNumber(secondsInput)));
        } else {
            params.set("pm", String(toNumber(paceMinutesInput)));
            params.set("ps", String(toNumber(paceSecondsInput)));
        }
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    };

    const calculate = ({ updateHistory = true } = {}) => {
        try {
            const result = getValues();
            currentResult = result;
            errorElement.textContent = "";
            resultPace.textContent = formatPace(result.paceSeconds);
            resultTime.textContent = formatDuration(result.totalSeconds, result.totalSeconds >= 3600);
            resultSpeed.textContent = `${(3600 / result.paceSeconds).toFixed(2)} km/h`;
            resultDistance.textContent = formatDistance(result.distance);
            renderSplits(result.paceSeconds);
            renderPredictions(result);
            renderLapPlan(result);
            renderInterval();
            renderRaceSplits(result);
            renderFueling(result);
            if (updateHistory) {
                updateUrl(result);
            }
        } catch (error) {
            errorElement.textContent = error.message;
        }
    };

    const updateMode = () => {
        const isTimeMode = getMode() === "time";
        timeFields.hidden = !isTimeMode;
        paceFields.hidden = isTimeMode;
        actionStatus.textContent = "";
    };

    const updateQuickDistanceState = () => {
        const distance = toNumber(distanceInput);
        quickDistanceButtons.forEach(button => {
            button.classList.toggle("is-active", Number(button.dataset.distance) === distance);
        });
    };

    const getResultText = () => {
        if (!currentResult) {
            return "";
        }
        const splitLines = splitDistances
            .map(split => `${split.label} ${formatDuration(currentResult.paceSeconds * split.km)}`)
            .join(" · ");
        return [
            `[MRC 페이스 계산] ${formatDistance(currentResult.distance)}`,
            `완주시간 ${formatDuration(currentResult.totalSeconds, currentResult.totalSeconds >= 3600)}`,
            `평균 페이스 ${formatPace(currentResult.paceSeconds)}/km`,
            splitLines,
            window.location.href
        ].join("\n");
    };

    const copyText = async text => {
        await navigator.clipboard.writeText(text);
        actionStatus.textContent = "계산 결과를 복사했습니다.";
    };

    const loadFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        if (!params.has("distance")) {
            return;
        }
        const mode = params.get("mode") === "pace" ? "pace" : "time";
        modeInputs.forEach(input => {
            input.checked = input.value === mode;
        });
        distanceInput.value = params.get("distance") || "10";
        if (mode === "time") {
            hoursInput.value = params.get("h") || "0";
            minutesInput.value = params.get("m") || "45";
            secondsInput.value = params.get("s") || "0";
        } else {
            paceMinutesInput.value = params.get("pm") || "4";
            paceSecondsInput.value = params.get("ps") || "30";
        }
    };

    form.addEventListener("submit", event => {
        event.preventDefault();
        calculate();
    });

    modeInputs.forEach(input => {
        input.addEventListener("change", () => {
            updateMode();
            calculate();
        });
    });

    quickDistanceButtons.forEach(button => {
        button.addEventListener("click", () => {
            distanceInput.value = button.dataset.distance;
            updateQuickDistanceState();
            calculate();
        });
    });

    distanceInput.addEventListener("input", updateQuickDistanceState);

    lapStrategy.addEventListener("change", () => {
        if (currentResult) renderLapPlan(currentResult);
    });

    [repeatDistanceInput, repeatCountInput, recoveryDistanceInput, recoveryMinutesInput, recoverySecondsInput]
        .forEach(input => input.addEventListener("input", renderInterval));

    [gelIntervalInput, firstGelInput].forEach(input => {
        input.addEventListener("change", () => {
            if (currentResult) renderFueling(currentResult);
        });
    });

    raceStartTimeInput.addEventListener("change", renderRaceTimeline);

    copyNoticeButton.addEventListener("click", () => {
        navigator.clipboard.writeText(trainingNotice.value).then(() => {
            noticeStatus.textContent = "카카오톡 훈련 공지를 복사했습니다.";
        }).catch(() => {
            trainingNotice.select();
            noticeStatus.textContent = "자동 복사가 되지 않았습니다. 선택된 내용을 직접 복사해 주세요.";
        });
    });

    copyButton.addEventListener("click", () => {
        copyText(getResultText()).catch(() => {
            actionStatus.textContent = "복사하지 못했습니다. 브라우저 권한을 확인해 주세요.";
        });
    });

    shareButton.addEventListener("click", async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: "MRC 페이스 계산 결과",
                    text: getResultText(),
                    url: window.location.href
                });
                actionStatus.textContent = "계산 결과를 공유했습니다.";
            } else {
                await copyText(window.location.href);
                actionStatus.textContent = "공유 링크를 복사했습니다.";
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                actionStatus.textContent = "공유하지 못했습니다. 다시 시도해 주세요.";
            }
        }
    });

    loadFromUrl();
    updateMode();
    updateQuickDistanceState();
    calculate({ updateHistory: false });
    renderRaceTimeline();
})();
