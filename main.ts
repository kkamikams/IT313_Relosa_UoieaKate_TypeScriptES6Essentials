import { computeAverage, EnrollmentStatus } from "./gradeUtils.js";
import getStatus from "./gradeUtils.js";

interface Enrollee {
    name: string;
    prelim:number;
    midterm: number;
    final: number;
}

const enrollees: Enrollee[] = [
    { name: "Ana Cruz", prelim: 85, midterm: 90, final: 88 },
    { name: "Bea Santos", prelim: 70, midterm: 65, final: 60 },
    { name: "Cid Ramos", prelim: 95, midterm: 92, final: 97 },
    { name: "Dex Alonzo", prelim: 60, midterm: 55, final: 50 },
    { name: "Eli Tan", prelim: 78, midterm: 80, final: 76 },
];

type EligibilityReport = {
    name: string;
    average: number;
    status: EnrollmentStatus;
    remarks?: string | undefined;
}

type BatchId = string | number;

function describeBatch(batchId: BatchId): string {
    if (typeof batchId === "string") {
        return `Batch reference: ${batchId.toUpperCase()}`;
    }
    return `Batch number: ${batchId.toFixed(0)}`;
}

const SIMULATE_FAILURE = false;

function getEnrollees(): Promise<Enrollee[]> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (SIMULATE_FAILURE) {
                reject(new Error("Failed to connect to registrar API"));
            } else {
                resolve(enrollees);
            }
        }, 800);
    });
}

async function main(): Promise<void> {
    const batchId: BatchId = "2026-A";
    console.log(describeBatch(batchId));

    try {
        const data = await getEnrollees();

        const reports: EligibilityReport[] = data.map((e) => {
            const average = computeAverage(e.prelim, e.midterm, e.final);
            const status = getStatus(average);
            const remarks =
            status === EnrollmentStatus.Probation ? "Needs consultation" : undefined;
            return { name: e.name, average, status, remarks};
        });

        const passingCount = reports.filter((r) => r.status === EnrollmentStatus.Passing).length;
        const classAverage = reports.reduce((sum, r) => sum + r.average, 0) / reports.length;

        function groupBy<T, K extends string>(
            items: T[],
            keyFn: (item: T) => K
        ): Record<K, T[]> {
            return items.reduce((acc, item) => {
                const key = keyFn(item);
                (acc[key] ??=[]).push(item);
            return acc;
            }, {} as Record<K, T[]>);
        }
        
        console.log("=== IT313 Enrollment Eligibility Report (TypeScript)");

        reports.forEach((r) => {
            const statusLabel = 
            r.status === EnrollmentStatus.Passing ? "PASSING": "PROBATION";
            const line = r.remarks
            ? `${r.name.padEnd(11)} - Average: ${r.average.toFixed(2)} - ${statusLabel} (${r.remarks})`
            : `${r.name.padEnd(11)} - Average: ${r.average.toFixed(2)} - ${statusLabel}`;
            console.log(line);
        });

        console.log(`Class Average: ${classAverage.toFixed(2)}`);
        console.log(`Passing: ${passingCount} / ${reports.length}`);

        const grouped = groupBy(reports, (r) => r.status);
        console.log("Grouped by status:", grouped);
    } catch (err) {
        if (err instanceof Error) {
            console.error(`Error fetching enrollees: ${err.message}`);
        } else {
            console.error("Unknown error occured while fetching enrollees.");
        }
    }
}

main();