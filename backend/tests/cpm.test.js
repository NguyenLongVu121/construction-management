const {
    calculateFS,
    calculateReverseFS,
    calculateSS,
    calculateReverseSS,
    calculateFF,
    calculateReverseFF,
    calculateSF,
    calculateReverseSF,
    calculateForwardPass,
    calculateBackwardPass,
    calculateSlackAndCriticalPath,
    calculateScheduleCPM
} = require("../src/services/cpmService");

describe("S-08 & S-09 CPM Calculation Algorithm", () => {
    describe("Task T-18 (S-08): Công thức duyệt xuôi viết tách riêng cho từng loại quan hệ", () => {
        test("calculateFS: Khởi sớm dựa trên quan hệ Finish-to-Start (ES = EF_pred + lag)", () => {
            const pred = { es: 0, ef: 5 };
            expect(calculateFS(pred, 0)).toBe(5);
            expect(calculateFS(pred, 2)).toBe(7);
            expect(calculateFS(pred, -1)).toBe(4);
            // Hỗ trợ truyền số trực tiếp (mốc EF)
            expect(calculateFS(8, 3)).toBe(11);
        });

        test("calculateSS: Khởi sớm dựa trên quan hệ Start-to-Start (ES = ES_pred + lag)", () => {
            const pred = { es: 4, ef: 10 };
            expect(calculateSS(pred, 0)).toBe(4);
            expect(calculateSS(pred, 3)).toBe(7);
            expect(calculateSS(pred, -2)).toBe(2);
            // Hỗ trợ truyền số trực tiếp (mốc ES)
            expect(calculateSS(6, 2)).toBe(8);
        });

        test("calculateFF: Khởi sớm dựa trên quan hệ Finish-to-Finish (ES = EF_pred + lag - duration)", () => {
            const pred = { es: 0, ef: 10 };
            const duration = 4;
            expect(calculateFF(pred, 0, duration)).toBe(6);  // 10 + 0 - 4
            expect(calculateFF(pred, 2, duration)).toBe(8);  // 10 + 2 - 4
            expect(calculateFF(12, 1, 5)).toBe(8);           // 12 + 1 - 5
        });

        test("calculateSF: Khởi sớm dựa trên quan hệ Start-to-Finish (ES = ES_pred + lag - duration)", () => {
            const pred = { es: 10, ef: 15 };
            const duration = 3;
            expect(calculateSF(pred, 0, duration)).toBe(7);  // 10 + 0 - 3
            expect(calculateSF(pred, 4, duration)).toBe(11); // 10 + 4 - 3
            expect(calculateSF(8, 2, 4)).toBe(6);            // 8 + 2 - 4
        });
    });

    describe("Task T-20 (S-09): Các hàm ngược đối ứng đặt cạnh hàm xuôi", () => {
        test("calculateReverseFS: Kết muộn LF của việc trước (LF = LS_succ - lag)", () => {
            const succ = { ls: 10, lf: 15 };
            expect(calculateReverseFS(succ, 0)).toBe(10);
            expect(calculateReverseFS(succ, 2)).toBe(8);
        });

        test("calculateReverseSS: Khởi muộn LS của việc trước (LS = LS_succ - lag)", () => {
            const succ = { ls: 8, lf: 12 };
            expect(calculateReverseSS(succ, 0)).toBe(8);
            expect(calculateReverseSS(succ, 3)).toBe(5);
        });

        test("calculateReverseFF: Kết muộn LF của việc trước (LF = LF_succ - lag)", () => {
            const succ = { ls: 8, lf: 14 };
            expect(calculateReverseFF(succ, 0)).toBe(14);
            expect(calculateReverseFF(succ, 2)).toBe(12);
        });

        test("calculateReverseSF: Khởi muộn LS của việc trước (LS = LF_succ - lag)", () => {
            const succ = { ls: 8, lf: 15 };
            expect(calculateReverseSF(succ, 0)).toBe(15);
            expect(calculateReverseSF(succ, 3)).toBe(12);
        });
    });

    describe("Task T-19 (S-08): Duyệt xuôi theo thứ tự đã sắp và lưu hai mốc sớm", () => {
        test("công việc không có việc trước bắt đầu ở ngày 0 và lưu ES, EF", () => {
            const tasks = [
                { id: "A", duration: 4, dependencies: [] },
                { id: "B", duration: 3, dependencies: [] }
            ];
            const resultMap = calculateForwardPass(tasks);

            expect(resultMap.get("A").es).toBe(0);
            expect(resultMap.get("A").ef).toBe(4);
            expect(resultMap.get("B").es).toBe(0);
            expect(resultMap.get("B").ef).toBe(3);
        });

        test("lấy giá trị lớn nhất trong các ràng buộc từ việc trước", () => {
            const tasks = [
                { id: "A", duration: 5, dependencies: [] },
                { id: "B", duration: 8, dependencies: [] },
                {
                    id: "C",
                    duration: 4,
                    dependencies: [
                        { predecessorId: "A", type: "FS", lag: 0 }, // ES = 5
                        { predecessorId: "B", type: "FS", lag: 0 }  // ES = 8 -> Max = 8
                    ]
                }
            ];
            const resultMap = calculateForwardPass(tasks);

            expect(resultMap.get("C").es).toBe(8);
            expect(resultMap.get("C").ef).toBe(12);
        });
    });

    describe("Task T-20 & T-21 (S-09): Duyệt ngược và xác định đường găng", () => {
        test("duyệt ngược từ ngày hoàn thành và tính LF, LS, Slack, isCritical", () => {
            // Sơ đồ chuẩn:
            // A (dur 5) -> B (dur 3) -> D (dur 2)
            // A (dur 5) -> C (dur 7) -> D (dur 2)
            const tasks = [
                { id: "A", duration: 5, dependencies: [] },
                { id: "B", duration: 3, dependencies: [{ predecessorId: "A", type: "FS", lag: 0 }] },
                { id: "C", duration: 7, dependencies: [{ predecessorId: "A", type: "FS", lag: 0 }] },
                {
                    id: "D",
                    duration: 2,
                    dependencies: [
                        { predecessorId: "B", type: "FS", lag: 0 },
                        { predecessorId: "C", type: "FS", lag: 0 }
                    ]
                }
            ];

            const resultMap = new Map();
            calculateForwardPass(tasks, resultMap);
            calculateBackwardPass(tasks, resultMap);
            calculateSlackAndCriticalPath(resultMap);

            const result = resultMap;

            // Dự án kết thúc ở ngày 14
            // D: ES=12, EF=14, LF=14, LS=12, Slack=0, isCritical=true
            expect(result.get("D").slack).toBe(0);
            expect(result.get("D").isCritical).toBe(true);

            // C: ES=5, EF=12, LF=12, LS=5, Slack=0, isCritical=true
            expect(result.get("C").slack).toBe(0);
            expect(result.get("C").isCritical).toBe(true);

            // B: ES=5, EF=8, LF=12, LS=9, Slack=4, isCritical=false
            expect(result.get("B").slack).toBe(4);
            expect(result.get("B").isCritical).toBe(false);

            // A: ES=0, EF=5, LF=5, LS=0, Slack=0, isCritical=true
            expect(result.get("A").slack).toBe(0);
            expect(result.get("A").isCritical).toBe(true);
        });

        test("hai đường găng song song (parallel critical paths) đều được đánh dấu isCritical = true", () => {
            // Mạng có 2 nhánh song song độ dài bằng nhau:
            // Start -> Path 1: A (4) -> B (6) -> 10 ngày
            // Start -> Path 2: C (5) -> D (5) -> 10 ngày
            // Cả hai nhánh hội tụ về E (3)
            const tasks = [
                { id: "A", duration: 4, dependencies: [] },
                { id: "B", duration: 6, dependencies: [{ predecessorId: "A", type: "FS", lag: 0 }] },
                { id: "C", duration: 5, dependencies: [] },
                { id: "D", duration: 5, dependencies: [{ predecessorId: "C", type: "FS", lag: 0 }] },
                {
                    id: "E",
                    duration: 3,
                    dependencies: [
                        { predecessorId: "B", type: "FS", lag: 0 },
                        { predecessorId: "D", type: "FS", lag: 0 }
                    ]
                }
            ];

            const result = calculateScheduleCPM(tasks);

            // Tổng thời gian dự án: 10 + 3 = 13 ngày
            expect(result.get("E").es).toBe(10);
            expect(result.get("E").ef).toBe(13);
            expect(result.get("E").slack).toBe(0);
            expect(result.get("E").isCritical).toBe(true);

            // Nhánh 1 (A -> B) là đường găng
            expect(result.get("A").slack).toBe(0);
            expect(result.get("A").isCritical).toBe(true);
            expect(result.get("B").slack).toBe(0);
            expect(result.get("B").isCritical).toBe(true);

            // Nhánh 2 (C -> D) cũng là đường găng song song
            expect(result.get("C").slack).toBe(0);
            expect(result.get("C").isCritical).toBe(true);
            expect(result.get("D").slack).toBe(0);
            expect(result.get("D").isCritical).toBe(true);
        });
    });

    describe("Kịch bản kiểm thử mẫu K-01 (Đáp án chuẩn mạng tiến độ)", () => {
        /**
         * Kịch bản mẫu K-01:
         * Công việc:
         * - A: Duration = 3, Pred = []
         * - B: Duration = 4, Pred = [A:FS]
         * - C: Duration = 2, Pred = [A:FS]
         * - D: Duration = 5, Pred = [B:FS]
         * - E: Duration = 6, Pred = [C:FS]
         * - F: Duration = 3, Pred = [D:FS, E:FS]
         * 
         * Bảng đáp án:
         * Task | Dur | ES | EF | LS | LF | Slack | isCritical
         * A    |  3  |  0 |  3 |  0 |  3 |   0   | true
         * B    |  4  |  3 |  7 |  3 |  7 |   0   | true
         * C    |  2  |  3 |  5 |  4 |  6 |   1   | false
         * D    |  5  |  7 | 12 |  7 | 12 |   0   | true
         * E    |  6  |  5 | 11 |  6 | 12 |   1   | false
         * F    |  3  | 12 | 15 | 12 | 15 |   0   | true
         * 
         * Đường găng duy nhất: A -> B -> D -> F (Tổng thời gian: 15 ngày)
         */
        test("khớp hoàn toàn với bảng đáp án kịch bản mẫu K-01", () => {
            const scenarioK01 = [
                { id: "A", duration: 3, dependencies: [] },
                { id: "B", duration: 4, dependencies: [{ predecessorId: "A", type: "FS", lag: 0 }] },
                { id: "C", duration: 2, dependencies: [{ predecessorId: "A", type: "FS", lag: 0 }] },
                { id: "D", duration: 5, dependencies: [{ predecessorId: "B", type: "FS", lag: 0 }] },
                { id: "E", duration: 6, dependencies: [{ predecessorId: "C", type: "FS", lag: 0 }] },
                {
                    id: "F",
                    duration: 3,
                    dependencies: [
                        { predecessorId: "D", type: "FS", lag: 0 },
                        { predecessorId: "E", type: "FS", lag: 0 }
                    ]
                }
            ];

            const result = calculateScheduleCPM(scenarioK01);

            // Kiểm tra từng công việc theo đúng bảng đáp án chuẩn K-01
            const expectedAnswers = [
                { id: "A", duration: 3, es: 0, ef: 3, ls: 0, lf: 3, slack: 0, isCritical: true },
                { id: "B", duration: 4, es: 3, ef: 7, ls: 3, lf: 7, slack: 0, isCritical: true },
                { id: "C", duration: 2, es: 3, ef: 5, ls: 4, lf: 6, slack: 1, isCritical: false },
                { id: "D", duration: 5, es: 7, ef: 12, ls: 7, lf: 12, slack: 0, isCritical: true },
                { id: "E", duration: 6, es: 5, ef: 11, ls: 6, lf: 12, slack: 1, isCritical: false },
                { id: "F", duration: 3, es: 12, ef: 15, ls: 12, lf: 15, slack: 0, isCritical: true }
            ];

            for (const expected of expectedAnswers) {
                const actual = result.get(expected.id);
                expect(actual).toBeDefined();
                expect(actual.es).toBe(expected.es);
                expect(actual.ef).toBe(expected.ef);
                expect(actual.ls).toBe(expected.ls);
                expect(actual.lf).toBe(expected.lf);
                expect(actual.slack).toBe(expected.slack);
                expect(actual.isCritical).toBe(expected.isCritical);
            }
        });
    });
});
