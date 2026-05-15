import { Request, Response } from "express";

const url = process.env.MASTER_API as string;

const MONTH_MAP = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const getSalesRevenueTrend = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ error: "Year is required" });
    }

    const vYear = parseInt(String(year));
    const vIndicator = `FY${vYear}${vYear + 1}`;

    const results = [];
    const monthSums: Record<string, number> = {};
    let totalSum = 0;

    for (let i = 1; i <= 12; i++) {
      const vMonth = i.toString().padStart(2, "0");
      const monthName = MONTH_MAP[i - 1]; // "Jan", "Feb", etc.
      const fullUrl = `${url}/CBS_CollectionTargetAcheivment_CRM?vMonth=${vMonth}&vIndicator=${vIndicator}`;

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();

      let monthTotal = 0;
      if (data?.statusCode === 0 && Array.isArray(data.responseObject)) {
        monthTotal = data.responseObject.reduce((sum: number, item: any) => {
          return sum + (parseFloat(item["Achieved Amt (Rs)"]) || 0);
        }, 0);
        monthSums[monthName] = parseFloat(monthTotal.toFixed(2));
        totalSum += monthTotal;
      } else {
        monthSums[monthName] = 0;
      }

      results.push({ month: monthName, data });
    }


    return res.status(200).json({
      year: vYear,
      indicator: vIndicator,
      achievedAmountSummary: monthSums,
      totalAchieved: parseFloat(totalSum.toFixed(2)),
      // months: results
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

export const getSalesRevenueDistribution = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { month, year } = req.query;

    if (!year) {
      return res.status(400).json({ error: "Year is required" });
    }
    if (!month) {
      return res.status(400).json({ error: "month is required" });
    }

    const vYear = parseInt(String(year), 10);
    const vMonth = parseInt(String(month), 10).toString().padStart(2, "0");
    const vIndicator = `FY${vYear}${vYear + 1}`;

    const fullUrl = `${url}/CBS_CollectionTargetAcheivment_CRM?vMonth=${vMonth}&vIndicator=${vIndicator}`;

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const json = await response.json();

    // aggregate Achieved % by Cluster
    const rows = Array.isArray(json.responseObject) ? json.responseObject : [];
    const agg: Record<string, { sum: number; count: number }> = {};

    for (const r of rows) {
      const cl = r.Cluster || "Unknown";
      const pct = parseFloat(r["Achieved %"]) || 0;
      if (!agg[cl]) agg[cl] = { sum: 0, count: 0 };
      agg[cl].sum += pct;
      agg[cl].count += 1;
    }

    const clusterAverages = Object.entries(agg).map(
      ([cluster, { sum, count }]) => ({
        Cluster: cluster,
        AverageAchievedPct: parseFloat((sum / count).toFixed(2)),
      })
    );

    return res.status(200).json({
      year: vYear,
      month: vMonth,
      indicator: vIndicator,
      clusterAverages,
    });
  } catch (error) {
    console.error("Error fetching distribution:", error);
    return res.status(500).json({ error: "Internal Server error" });
  }
};


export const getSalesRevenueQty = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({ error: "Year is required" });
    }

    // build indicator from two‑digit fiscal year code
    const fyStart = parseInt(String(year), 10);
    const fyEnd = fyStart + 1;
    const vIndicator = `FY${String(fyStart).padStart(2, "0")}${String(
      fyEnd
    ).padStart(2, "0")}`;

    const monthSums: Record<string, number> = {};
    let totalQty = 0;

    // fetch month‑by‑month
    for (let i = 1; i <= 12; i++) {
      const vMonth = i.toString().padStart(2, "0");
      const monthName = MONTH_MAP[i - 1];
      const fullUrl = `${url}/CBS_SalesQtyTargetAcheivment_CRM?vMonth=${vMonth}&vIndicator=${vIndicator}`;

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      let monthTotal = 0;
      if (data?.statusCode === 0 && Array.isArray(data.responseObject)) {
        monthTotal = data.responseObject.reduce((sum: number, item: any) => {
          return sum + (parseFloat(item["Achieved Qty (MT)"]) || 0);
        }, 0);
      }

      monthSums[monthName] = parseFloat(monthTotal.toFixed(2));
      totalQty += monthTotal;
    }

    return res.status(200).json({
      fiscalStart: fyStart,
      indicator: vIndicator,
      achievedQtySummary: monthSums,
      totalAchievedQty: parseFloat(totalQty.toFixed(2)),
    });
  } catch (error) {
    console.error("Error fetching sales‑qty trend:", error);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

export const getSalesRevenueQtyDistribution = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { year, month } = req.query;
    if (!year) return res.status(400).json({ error: "Year is required" });
    if (!month) return res.status(400).json({ error: "Month is required" });

    const vYear = parseInt(String(year), 10);
    const vMonth = String(parseInt(String(month), 10)).padStart(2, "0");
    const fyStart = vYear;
    const fyEnd = vYear + 1;
    const vIndicator = `FY${String(fyStart).padStart(2, "0")}${String(
      fyEnd
    ).padStart(2, "0")}`;

    const fullUrl = `${url}/CBS_SalesQtyTargetAcheivment_CRM?vMonth=${vMonth}&vIndicator=${vIndicator}`;
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const json = await response.json();
    const rows = Array.isArray(json.responseObject) ? json.responseObject : [];

    // aggregate ACHIEVED % by Cluster
    const agg: Record<string, { sum: number; count: number }> = {};
    for (const r of rows) {
      const cl = r.Cluster || "Unknown";
      const pct = parseFloat(r["ACHIEVED %"]) || 0;
      if (!agg[cl]) agg[cl] = { sum: 0, count: 0 };
      agg[cl].sum += pct;
      agg[cl].count += 1;
    }
    const clusterAverages = Object.entries(agg).map(
      ([Cluster, { sum, count }]) => ({
        Cluster,
        AverageAchievedPct: parseFloat((sum / count).toFixed(2)),
      })
    );

    return res.status(200).json({
      year: vYear,
      month: vMonth,
      indicator: vIndicator,
      clusterAverages,
    });
  } catch (error) {
    console.error("Error fetching sales-qty distribution:", error);
    return res.status(500).json({ error: "Internal Server error" });
  }
};


const pad2 = (n: number) => String(n).padStart(2, "0");

export const getDrops = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { year, month } = req.query;
    if (!year) return res.status(400).json({ error: "Year is required" });
    if (!month) return res.status(400).json({ error: "Month is required" });

    const fyStart = parseInt(String(year), 10);
    const fyEnd = fyStart + 1;
    const vIndicator = `FY${pad2(fyStart)}${pad2(fyEnd)}`;
    const vMonth = pad2(parseInt(String(month), 10));

    // generic fetch+dedupe helper; nameKey differs by endpoint
    const fetchDrops = async (endpoint: string, nameKey: any) => {
      const resp = await fetch(
        `${url}/${endpoint}?vMonth=${vMonth}&vIndicator=${vIndicator}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      const json = await resp.json();
      const arr: any[] = Array.isArray(json.responseObject)
        ? json.responseObject
        : [];

      const personMap: any = new Map<number, { SlpCode: any;[nameKey: string]: string }>();
      const projectSet = new Map<number, { SlpCode: any;[nameKey: string]: string | number }>();
      const clusterSet = new Set<string>();
      const brandSet = new Set<string>();

      for (const item of arr) {
        const code = Number(item.SlpCode);
        const name = item[nameKey] as string;
        if (name?.toUpperCase().includes("PROJECT")) {
          // 👇 Only push into projects, not personMap
          if (!projectSet.has(code)) {
            projectSet.set(code, { SlpCode: code, [nameKey]: name });
          }
        } else {
          // 👇 Normal salespersons
          if (!personMap.has(code)) {
            personMap.set(code, { SlpCode: code, [nameKey]: name });
          }
        }
        if (item.Cluster) {
          clusterSet.add(item.Cluster);
        }
        if (item?.Brand) {
          brandSet.add(item?.Brand);
        }
      }

      return {
        salesPerson: Array.from(personMap.values()),
        projects: Array.from(projectSet.values()),
        cluster: Array.from(clusterSet.values()),
        brand: Array.from(brandSet.values()),
      };
    };

    // call both APIs in parallel with the correct name keys
    const [qtyDrops, colDrops] = await Promise.all([
      // Sales-Qty API uses “Sales Employee Name”
      fetchDrops("CBS_SalesQtyTargetAcheivment_CRM", "Sales Employee Name"),
      // Collection API uses “SlpName”
      fetchDrops("CBS_CollectionTargetAcheivment_CRM", "SlpName"),
    ]);

    return res.status(200).json({
      year: fyStart,
      month: vMonth,
      indicator: vIndicator,
      salesQtyDrops: qtyDrops,
      collectionDrops: colDrops,
    });
  } catch (error) {
    console.error("Error in getDrops:", error);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

export const getSalesOverallRevenueDistribution = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { year, month, slpCode, cluster, project } = req.query;
    if (!year) return res.status(400).json({ error: "Year is required" });
    if (!month) return res.status(400).json({ error: "Month is required" });

    const fyStart = parseInt(String(year), 10);
    const fyEnd = fyStart + 1;
    const vIndicator = `FY${pad2(fyStart)}${pad2(fyEnd)}`;
    const vMonth = pad2(parseInt(String(month), 10));

    // fetch raw data
    const resp = await fetch(
      `${url}/CBS_CollectionTargetAcheivment_CRM?vMonth=${vMonth}&vIndicator=${vIndicator}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    const json = await resp.json();
    let arr: any[] = Array.isArray(json.responseObject)
      ? json.responseObject
      : [];

    // apply filters
    if (slpCode) {
      const codeNum = Number(slpCode);
      arr = arr.filter((item) => Number(item.SlpCode) === codeNum);
    }

    if (cluster) {
      arr = arr.filter((item) => item.Cluster === String(cluster));
    }

    if (project === "true") {
      // ✅ keep only PROJECT data
      arr = arr.filter((item) =>
        String(item.SlpName || item["Sales Employee Name"])
          ?.toUpperCase()
          .includes("PROJECT")
      );
    } else {
      // ✅ exclude PROJECT data
      arr = arr.filter(
        (item) =>
          !String(item.SlpName || item["Sales Employee Name"])
            ?.toUpperCase()
            .includes("PROJECT")
      );
    }

    const uniqueArr = Object.values(
      arr.reduce((acc, item) => {
        const name = String(item.SlpName || item["Sales Employee Name"]);
        const achieved = Number(item["Achieved Amt (Rs)"]) || 0;

        if (!acc[name] || achieved > (Number(acc[name]["Achieved Amt (Rs)"]) || 0)) {
          acc[name] = item;
        }
        return acc;
      }, {} as Record<string, any>)
    );

    return res.status(200).json({
      year: fyStart,
      month: vMonth,
      indicator: vIndicator,
      slpCode: slpCode || null,
      cluster: cluster || null,
      project: project === "true",
      data: uniqueArr,
    });
  } catch (error) {
    console.error("Error in getSalesOverallRevenueDistribution:", error);
    return res.status(500).json({ error: "Internal Server error" });
  }
};


export const getSalesOverallRevenueQtyDistribution = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { year, month, slpCode, cluster, project, brand } = req.query;
    if (!year) return res.status(400).json({ error: "Year is required" });
    if (!month) return res.status(400).json({ error: "Month is required" });

    const fyStart = parseInt(String(year), 10);
    const fyEnd = fyStart + 1;
    const vIndicator = `FY${pad2(fyStart)}${pad2(fyEnd)}`;
    const vMonth = pad2(parseInt(String(month), 10));

    // fetch raw data
    const resp = await fetch(
      `${url}/CBS_SalesQtyTargetAcheivment_CRM?vMonth=${vMonth}&vIndicator=${vIndicator}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    const json = await resp.json();
    let arr: any[] = Array.isArray(json.responseObject)
      ? json.responseObject
      : [];

    // apply filters
    if (slpCode) {
      const codeNum = Number(slpCode);
      arr = arr.filter((item) => Number(item.SlpCode) === codeNum);
    }
    if (cluster) {
      arr = arr.filter((item) => item.Cluster === String(cluster));
    }
    if (brand) {
      arr = arr.filter((item) => item.Brand === String(brand));
    }

    if (project === "true") {
      // ✅ keep only PROJECT data
      arr = arr.filter((item) =>
        String(item["Sales Employee Name"] || item.SlpName)
          ?.toUpperCase()
          .includes("PROJECT")
      );
    } else {
      // ✅ exclude PROJECT data
      arr = arr.filter(
        (item) =>
          !String(item["Sales Employee Name"] || item.SlpName)
            ?.toUpperCase()
            .includes("PROJECT")
      );
    }

    const uniqueArr = Object.values(
      arr.reduce((acc, item) => {
        const name = String(item.SlpName || item["Sales Employee Name"]);
        const achieved = Number(item["Achieved Qty (MT)"]) || 0;

        if (!acc[name] || achieved > (Number(acc[name]["Achieved Qty (MT)"]) || 0)) {
          acc[name] = item;
        }
        return acc;
      }, {} as Record<string, any>)
    );

    return res.status(200).json({
      year: fyStart,
      month: vMonth,
      indicator: vIndicator,
      slpCode: slpCode || null,
      cluster: cluster || null,
      project: project === "true",
      data: uniqueArr,
    });
  } catch (error) {
    console.error("Error in getSalesOverallRevenueQtyDistribution:", error);
    return res.status(500).json({ error: "Internal Server error" });
  }
};


async function fetchAndRank(
  endpoint: string,
  vMonth: string,
  vIndicator: string
) {
  const resp = await fetch(
    `${url}/${endpoint}?vMonth=${vMonth}&vIndicator=${vIndicator}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );
  const json = await resp.json();
  let arr: any[] = Array.isArray(json.responseObject)
    ? json.responseObject
    : [];

  // ✅ filter out PROJECT names
  arr = arr.filter(
    (item) =>
      !String(item["Sales Employee Name"] || item.SlpName)
        .toUpperCase()
        .includes("PROJECT")
  );

  const uniqueArr: any[] = Object.values(
    arr.reduce((acc, item) => {
      const name = String(item.SlpName || item["Sales Employee Name"]);
      const achieved = Number(item["Achieved %"] || item["ACHIEVED %"]) || 0;

      if (!acc[name] || achieved > (Number(acc[name]["Achieved %"] || acc[name]["ACHIEVED %"]) || 0)) {
        acc[name] = item;
      }
      return acc;
    }, {} as Record<string, any>)
  );

  // sort descending by ACHIEVED %
  const sorted = uniqueArr.sort((a, b) => {
    const aPct = parseFloat((a["Achieved %"] || a["ACHIEVED %"]) ?? 0);
    const bPct = parseFloat((b["Achieved %"] || b["ACHIEVED %"]) ?? 0);
    return bPct - aPct;
  });

  return {
    top3: sorted.slice(0, 3),
    bottom3: sorted.slice(-3),
  };
}

export const getSalesTopPerformance = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { year, month } = req.query;
    if (!year) return res.status(400).json({ error: "Year is required" });
    if (!month) return res.status(400).json({ error: "Month is required" });

    const fyStart = parseInt(String(year), 10);
    const fyEnd = fyStart + 1;
    const vIndicator = `FY${pad2(fyStart)}${pad2(fyEnd)}`;
    const vMonth = pad2(parseInt(String(month), 10));

    const { top3, bottom3 } = await fetchAndRank(
      "CBS_CollectionTargetAcheivment_CRM",
      vMonth,
      vIndicator
    );

    return res.status(200).json({
      year: fyStart,
      month: vMonth,
      indicator: vIndicator,
      topPerformance: top3,
      bottomPerformance: bottom3,
    });
  } catch (error) {
    console.error("Error in getSalesTopPerformance:", error);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

export const getSalesTopQtyPerformance = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { year, month } = req.query;
    if (!year) return res.status(400).json({ error: "Year is required" });
    if (!month) return res.status(400).json({ error: "Month is required" });

    const fyStart = parseInt(String(year), 10);
    const fyEnd = fyStart + 1;
    const vIndicator = `FY${pad2(fyStart)}${pad2(fyEnd)}`;
    const vMonth = pad2(parseInt(String(month), 10));

    const { top3, bottom3 } = await fetchAndRank(
      "CBS_SalesQtyTargetAcheivment_CRM",
      vMonth,
      vIndicator
    );

    return res.status(200).json({
      year: fyStart,
      month: vMonth,
      indicator: vIndicator,
      topPerformance: top3,
      bottomPerformance: bottom3,
    });
  } catch (error) {
    console.error("Error in getSalesTopQtyPerformance:", error);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

export const getEstimationAndQtyBySlpId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { year, month, slpId } = req.query;
    if (!year) return res.status(400).json({ error: "Year is required" });
    if (!month) return res.status(400).json({ error: "Month is required" });
    if (!slpId) return res.status(400).json({ error: "slpId is required" });


    const vIndicator = year;
    const vMonth = month;
    const codeNum = Number(slpId);

    // const fyStart = parseInt(String(year), 10);
    // const fyEnd = fyStart + 1;
    // const vIndicator = `FY${pad2(fyStart)}${pad2(fyEnd)}`;
    // const vMonth = pad2(parseInt(String(month), 10));
    // const codeNum = Number(slpId);

    // fetch collection data
    const cRes = await fetch(
      `${url}/CBS_CollectionTargetAcheivment_CRM?vMonth=${vMonth}&vIndicator=${vIndicator}`,
      { headers: { "Content-Type": "application/json" } }
    );
    const cJson = await cRes.json();
    const collectionData = Array.isArray(cJson.responseObject)
      ? cJson.responseObject.filter((item: any) => Number(item.SlpCode) === codeNum)
      : [];

    // fetch qty data
    const qRes = await fetch(
      `${url}/CBS_SalesQtyTargetAcheivment_CRM?vMonth=${vMonth}&vIndicator=${vIndicator}`,
      { headers: { "Content-Type": "application/json" } }
    );
    const qJson = await qRes.json();
    const qtyData = Array.isArray(qJson.responseObject)
      ? qJson.responseObject.filter((item: any) => Number(item.SlpCode) === codeNum)
      : [];

    return res.status(200).json({
      // year: fyStart,
      month: vMonth,
      slpCode: codeNum,
      estimation: collectionData,
      quantity: qtyData,
    });
  } catch (error) {
    console.error("Error in getEstimationAndQtyBySlpId:", error);
    return res.status(500).json({ error: "Internal Server error" });
  }
};


// export const getEstimationAndQtyBySlpId = async (
//   req: Request,
//   res: Response
// ): Promise<Response> => {
//   try {
//     const { vIndicator,slpId, vMonth } = req.query;

//     if (!vIndicator) {
//       return res.status(400).json({ error: "vIndicator is required" });
//     }
//     if (!vMonth) {
//       return res.status(400).json({ error: "vMonth is required" });
//     }
//     if (!slpId) {
//       return res.status(400).json({ error: "slpId is required" });
//     }

//     const codeNum = Number(slpId);

//     // fetch collection estimation data
//     const cRes = await fetch(
//       `${url}/CBS_CollectionTargetAcheivment_CRM?vIndicator=${vIndicator}&vMonth=${vMonth}`,
//       { headers: { "Content-Type": "application/json" } }
//     );
//     const cJson = await cRes.json();
//     const estimation = Array.isArray(cJson.responseObject)
//       ? cJson.responseObject.filter((item : any) => Number(item.SlpCode) === codeNum)
//       : [];

//     // fetch qty data
//     const qRes = await fetch(
//       `${url}/CBS_SalesQtyTargetAcheivment_CRM?vIndicator=${vIndicator}&vMonth=${vMonth}`,
//       { headers: { "Content-Type": "application/json" } }
//     );
//     const qJson = await qRes.json();
//     const quantity = Array.isArray(qJson.responseObject)
//       ? qJson.responseObject.filter((item : any) => Number(item.SlpCode) === codeNum)
//       : [];

//     return res.status(200).json({
//       vIndicator,
//       vMonth,
//       slpCode: codeNum,
//       estimation,
//       quantity
//     });
//   } catch (error) {
//     console.error("Error in getEstimationAndQtyBySlpId:", error);
//     return res.status(500).json({ error: "Internal Server error" });
//   }
// };


export const getClusterWiseTotalTargetVsAchieved = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { month, year } = req.query;

    if (!year) {
      return res.status(400).json({ error: "Year is required" });
    }
    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }

    const vYear = parseInt(String(year), 10);
    const vMonth = parseInt(String(month), 10).toString().padStart(2, "0");
    const vIndicator = `FY${vYear}${vYear + 1}`;

    const fullUrl = `${url}/CBS_CollectionTargetAcheivment_CRM?vMonth=${vMonth}&vIndicator=${vIndicator}`;

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const json = await response.json();
    const rows = Array.isArray(json.responseObject) ? json.responseObject : [];

    const agg: Record<string, { achievedAmt: number; targetAmt: number }> = {};

    for (const r of rows) {
      const cl = r.Cluster || "Unknown";
      const achievedAmt = parseFloat(r["Achieved Amt (Rs)"]) || 0;
      const targetAmt = parseFloat(r["Target Amt (Rs)"]) || 0;

      if (!agg[cl]) {
        agg[cl] = {
          achievedAmt: 0,
          targetAmt: 0,
        };
      }

      agg[cl].achievedAmt += achievedAmt;
      agg[cl].targetAmt += targetAmt;
    }

    const clusterData = Object.entries(agg).map(
      ([cluster, { achievedAmt, targetAmt }]) => ({
        Cluster: cluster,
        TotalAchievedAmt: parseFloat(achievedAmt.toFixed(2)),
        TotalTargetAmt: parseFloat(targetAmt.toFixed(2)),
      })
    );

    return res.status(200).json({
      year: vYear,
      month: vMonth,
      indicator: vIndicator,
      clusterData,
    });

  } catch (error) {
    console.error("Error fetching distribution:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getClusterWiseTotalTargetVsAchievedQty = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { month, year } = req.query;

    if (!year) {
      return res.status(400).json({ error: "Year is required" });
    }
    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }

    const vYear = parseInt(String(year), 10);
    const vMonth = parseInt(String(month), 10).toString().padStart(2, "0");
    const vIndicator = `FY${vYear}${vYear + 1}`;

    const fullUrl = `${url}/CBS_SalesQtyTargetAcheivment_CRM?vMonth=${vMonth}&vIndicator=${vIndicator}`;

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const json = await response.json();
    const rows = Array.isArray(json.responseObject) ? json.responseObject : [];

    const agg: Record<string, { achievedQty: number; targetQty: number }> = {};

    for (const r of rows) {
      const cl = r.Cluster || "Unknown";
      const achievedQty = parseFloat(r["Achieved Qty (MT)"]) || 0;
      const targetQty = parseFloat(r["Target Qty (MT)"]) || 0;

      if (!agg[cl]) {
        agg[cl] = {
          achievedQty: 0,
          targetQty: 0,
        };
      }

      agg[cl].achievedQty += achievedQty;
      agg[cl].targetQty += targetQty;
    }

    const clusterData = Object.entries(agg).map(
      ([cluster, { achievedQty, targetQty }]) => ({
        Cluster: cluster,
        TotalAchievedQty: parseFloat(achievedQty.toFixed(2)),
        TotalTargetQty: parseFloat(targetQty.toFixed(2)),
      })
    );

    return res.status(200).json({
      year: vYear,
      month: vMonth,
      indicator: vIndicator,
      clusterData,
    });

  } catch (error) {
    console.error("Error fetching distribution:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
