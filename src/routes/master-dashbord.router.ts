import { Router } from "express";
import { getClusterWiseTotalTargetVsAchieved, getClusterWiseTotalTargetVsAchievedQty, getDrops, getEstimationAndQtyBySlpId, getSalesOverallRevenueDistribution, getSalesOverallRevenueQtyDistribution, getSalesRevenueDistribution, getSalesRevenueQty, getSalesRevenueQtyDistribution, getSalesRevenueTrend, getSalesTopPerformance, getSalesTopQtyPerformance } from "../controllers/master-dashbord.controller";


const router = Router();

router.get("/sales-revenue-trend", getSalesRevenueTrend);
router.get("/sales-revenue-distribution", getSalesRevenueDistribution);
router.get("/sales-revenue-qty", getSalesRevenueQty);
router.get("/sales-revenue-qty-distribution", getSalesRevenueQtyDistribution);
router.get("/drops", getDrops);
router.get("/sales-overall-revenue-distribution", getSalesOverallRevenueDistribution);
router.get("/sales-overall-revenue-qty-distribution", getSalesOverallRevenueQtyDistribution);
router.get("/sales-top-performance", getSalesTopPerformance);
router.get("/sales-top-qty-performance", getSalesTopQtyPerformance);
router.get("/estimation-and-qty", getEstimationAndQtyBySlpId);
router.get("/cluster-wise-total-target-vs-achieved-collection", getClusterWiseTotalTargetVsAchieved);
router.get("/cluster-wise-total-target-vs-achieved-qty", getClusterWiseTotalTargetVsAchievedQty);



export default router;