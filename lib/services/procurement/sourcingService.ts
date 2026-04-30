/**
 * Sourcing Service
 * Comprehensive sourcing and vendor selection - RFQ, RFP, RFI, auctions, negotiation
 * Integrates with Proposals-RFQ module (ZERO DUPLICATION)
 */

import { eventBus } from "@/lib/services/event-store";
import type { DomainEvent } from "@/types/cqrs";
import type { SourcingMethod } from "@/types/procurement";

// TODO: Import RFQ service from Proposals-RFQ module
// import { rfqService } from '@/lib/services/proposals/RFQService'

export interface SourcingRequest {
  id: string;
  tenantId: string;
  requisitionId?: string;
  type: "RFQ" | "RFP" | "RFI" | "AUCTION";
  title: string;
  description?: string;
  items: Array<{
    itemName: string;
    description?: string;
    quantity: number;
    unit: string;
    specifications?: string;
  }>;
  requirements?: string[];
  evaluationCriteria?: Array<{
    criterion: string;
    weight: number;
    description?: string;
  }>;
  deadline: Date | string;
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "IN_PROGRESS"
    | "CLOSED"
    | "AWARDED"
    | "CANCELLED";
  invitedVendors?: string[];
  responses?: SourcingResponse[];
  awardedVendorId?: string;
  createdAt: Date | string;
  createdBy: string;
}

export interface SourcingResponse {
  id: string;
  sourcingRequestId: string;
  vendorId: string;
  vendorName: string;
  items: Array<{
    itemName: string;
    unitPrice: number;
    totalPrice: number;
    currency: string;
    leadTime?: number;
    specifications?: string;
  }>;
  totalAmount: number;
  currency: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  validity?: Date | string;
  notes?: string;
  submittedAt: Date | string;
  status: "SUBMITTED" | "EVALUATED" | "SHORTLISTED" | "AWARDED" | "REJECTED";
  evaluationScore?: number;
}

export interface Auction {
  id: string;
  tenantId: string;
  requisitionId?: string;
  title: string;
  description?: string;
  items: Array<{
    itemName: string;
    quantity: number;
    unit: string;
    startingPrice: number;
    reservePrice?: number;
    currency: string;
  }>;
  startTime: Date | string;
  endTime: Date | string;
  status: "SCHEDULED" | "LIVE" | "CLOSED" | "CANCELLED";
  participants: string[];
  bids: AuctionBid[];
  winningBids?: Array<{
    itemName: string;
    vendorId: string;
    vendorName: string;
    bidAmount: number;
  }>;
  createdAt: Date | string;
  createdBy: string;
}

export interface AuctionBid {
  id: string;
  auctionId: string;
  vendorId: string;
  vendorName: string;
  itemName: string;
  bidAmount: number;
  currency: string;
  submittedAt: Date | string;
  status: "ACTIVE" | "OUTBID" | "WINNING" | "WITHDRAWN";
}

// In-memory storage
const sourcingRequests = new Map<string, SourcingRequest>();
const sourcingResponses = new Map<string, SourcingResponse>();
const auctions = new Map<string, Auction>();
const auctionBids = new Map<string, AuctionBid[]>();

export class SourcingService {
  /**
   * Create RFQ (Request for Quotation)
   * Reuses Proposals-RFQ module functionality
   */
  async createRFQ(
    tenantId: string,
    requisitionId: string,
    title: string,
    items: Array<{
      itemName: string;
      description?: string;
      quantity: number;
      unit: string;
      specifications?: string;
    }>,
    invitedVendors: string[],
    deadline: Date | string,
    userId: string,
  ): Promise<SourcingRequest> {
    // TODO: Create RFQ using Proposals-RFQ service
    // const rfq = await rfqService.createRFQ({
    //   tenantId,
    //   title,
    //   items,
    //   invitedVendors,
    //   deadline,
    //   createdBy: userId,
    // })

    const requestId = `rfq-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const request: SourcingRequest = {
      id: requestId,
      tenantId,
      requisitionId,
      type: "RFQ",
      title,
      items,
      invitedVendors,
      deadline,
      status: "PUBLISHED",
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    sourcingRequests.set(requestId, request);

    // Publish event
    await eventBus.publish({
      type: "procurement.sourcing.rfq.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        sourcingRequestId: requestId,
        tenantId,
        requisitionId,
        type: "RFQ",
        invitedVendors,
      },
    } as DomainEvent);

    return request;
  }

  /**
   * Create RFP (Request for Proposal)
   */
  async createRFP(
    tenantId: string,
    requisitionId: string,
    title: string,
    description: string,
    items: Array<{
      itemName: string;
      description?: string;
      quantity: number;
      unit: string;
      specifications?: string;
    }>,
    requirements: string[],
    evaluationCriteria: Array<{
      criterion: string;
      weight: number;
      description?: string;
    }>,
    invitedVendors: string[],
    deadline: Date | string,
    userId: string,
  ): Promise<SourcingRequest> {
    const requestId = `rfp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const request: SourcingRequest = {
      id: requestId,
      tenantId,
      requisitionId,
      type: "RFP",
      title,
      description,
      items,
      requirements,
      evaluationCriteria,
      invitedVendors,
      deadline,
      status: "PUBLISHED",
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    sourcingRequests.set(requestId, request);

    // Publish event
    await eventBus.publish({
      type: "procurement.sourcing.rfp.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        sourcingRequestId: requestId,
        tenantId,
        requisitionId,
        type: "RFP",
        invitedVendors,
      },
    } as DomainEvent);

    return request;
  }

  /**
   * Create RFI (Request for Information)
   */
  async createRFI(
    tenantId: string,
    title: string,
    description: string,
    requirements: string[],
    invitedVendors: string[],
    deadline: Date | string,
    userId: string,
  ): Promise<SourcingRequest> {
    const requestId = `rfi-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const request: SourcingRequest = {
      id: requestId,
      tenantId,
      type: "RFI",
      title,
      description,
      items: [],
      requirements,
      invitedVendors,
      deadline,
      status: "PUBLISHED",
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    sourcingRequests.set(requestId, request);

    // Publish event
    await eventBus.publish({
      type: "procurement.sourcing.rfi.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        sourcingRequestId: requestId,
        tenantId,
        type: "RFI",
        invitedVendors,
      },
    } as DomainEvent);

    return request;
  }

  /**
   * Submit sourcing response (vendor quote/proposal)
   */
  async submitResponse(
    sourcingRequestId: string,
    tenantId: string,
    vendorId: string,
    vendorName: string,
    items: Array<{
      itemName: string;
      unitPrice: number;
      totalPrice: number;
      currency: string;
      leadTime?: number;
      specifications?: string;
    }>,
    paymentTerms?: string,
    deliveryTerms?: string,
    validity?: Date | string,
    notes?: string,
  ): Promise<SourcingResponse> {
    const request = sourcingRequests.get(sourcingRequestId);
    if (!request || request.tenantId !== tenantId) {
      throw new Error("Sourcing request not found");
    }

    if (request.status !== "PUBLISHED" && request.status !== "IN_PROGRESS") {
      throw new Error("Sourcing request is not accepting responses");
    }

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const currency = items[0]?.currency || "SAR";

    const responseId = `response-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const response: SourcingResponse = {
      id: responseId,
      sourcingRequestId,
      vendorId,
      vendorName,
      items,
      totalAmount,
      currency,
      paymentTerms,
      deliveryTerms,
      validity,
      notes,
      submittedAt: new Date().toISOString(),
      status: "SUBMITTED",
    };

    sourcingResponses.set(responseId, response);

    // Add to request
    if (!request.responses) {
      request.responses = [];
    }
    request.responses.push(response);
    request.status = "IN_PROGRESS";
    sourcingRequests.set(sourcingRequestId, request);

    // Publish event
    await eventBus.publish({
      type: "procurement.sourcing.response.submitted",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        sourcingRequestId,
        responseId,
        tenantId,
        vendorId,
        vendorName,
        totalAmount,
        currency,
      },
    } as DomainEvent);

    return response;
  }

  /**
   * Evaluate sourcing responses
   */
  async evaluateResponses(
    sourcingRequestId: string,
    tenantId: string,
    evaluations: Array<{
      responseId: string;
      scores: Array<{
        criterion: string;
        score: number;
        comments?: string;
      }>;
      overallScore: number;
      comments?: string;
    }>,
    evaluatorId: string,
  ): Promise<SourcingResponse[]> {
    const request = sourcingRequests.get(sourcingRequestId);
    if (!request || request.tenantId !== tenantId) {
      throw new Error("Sourcing request not found");
    }

    const updatedResponses: SourcingResponse[] = [];

    evaluations.forEach((eval) => {
      const response = sourcingResponses.get(eval.responseId);
      if (response && response.sourcingRequestId === sourcingRequestId) {
        response.evaluationScore = eval.overallScore;
        response.status = "EVALUATED";
        sourcingResponses.set(eval.responseId, response);
        updatedResponses.push(response);
      }
    });

    // Sort by score (highest first)
    updatedResponses.sort(
      (a, b) => (b.evaluationScore || 0) - (a.evaluationScore || 0),
    );

    // Update request
    if (request.responses) {
      request.responses = request.responses.map((r) => {
        const eval = evaluations.find((e) => e.responseId === r.id);
        if (eval) {
          return {
            ...r,
            evaluationScore: eval.overallScore,
            status: "EVALUATED",
          };
        }
        return r;
      });
    }
    sourcingRequests.set(sourcingRequestId, request);

    // Publish event
    await eventBus.publish({
      type: "procurement.sourcing.responses.evaluated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        sourcingRequestId,
        tenantId,
        evaluations: evaluations.map((e) => ({
          responseId: e.responseId,
          overallScore: e.overallScore,
        })),
      },
    } as DomainEvent);

    return updatedResponses;
  }

  /**
   * Award sourcing request to vendor
   */
  async awardVendor(
    sourcingRequestId: string,
    tenantId: string,
    vendorId: string,
    responseId: string,
    awardedBy: string,
  ): Promise<SourcingRequest> {
    const request = sourcingRequests.get(sourcingRequestId);
    if (!request || request.tenantId !== tenantId) {
      throw new Error("Sourcing request not found");
    }

    const response = sourcingResponses.get(responseId);
    if (!response || response.vendorId !== vendorId) {
      throw new Error("Response not found");
    }

    request.awardedVendorId = vendorId;
    request.status = "AWARDED";
    response.status = "AWARDED";

    sourcingRequests.set(sourcingRequestId, request);
    sourcingResponses.set(responseId, response);

    // Publish event
    await eventBus.publish({
      type: "procurement.sourcing.awarded",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        sourcingRequestId,
        tenantId,
        vendorId,
        responseId,
        awardedBy,
      },
    } as DomainEvent);

    return request;
  }

  /**
   * Create reverse auction
   */
  async createAuction(
    tenantId: string,
    requisitionId: string,
    title: string,
    items: Array<{
      itemName: string;
      quantity: number;
      unit: string;
      startingPrice: number;
      reservePrice?: number;
      currency: string;
    }>,
    startTime: Date | string,
    endTime: Date | string,
    participants: string[],
    userId: string,
  ): Promise<Auction> {
    const auctionId = `auction-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const auction: Auction = {
      id: auctionId,
      tenantId,
      requisitionId,
      title,
      items,
      startTime,
      endTime,
      status: "SCHEDULED",
      participants,
      bids: [],
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    auctions.set(auctionId, auction);

    // Publish event
    await eventBus.publish({
      type: "procurement.sourcing.auction.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        auctionId,
        tenantId,
        requisitionId,
        startTime,
        endTime,
        participants,
      },
    } as DomainEvent);

    return auction;
  }

  /**
   * Submit auction bid
   */
  async submitBid(
    auctionId: string,
    tenantId: string,
    vendorId: string,
    vendorName: string,
    itemName: string,
    bidAmount: number,
    currency: string,
  ): Promise<AuctionBid> {
    const auction = auctions.get(auctionId);
    if (!auction || auction.tenantId !== tenantId) {
      throw new Error("Auction not found");
    }

    if (auction.status !== "LIVE") {
      throw new Error("Auction is not live");
    }

    if (!auction.participants.includes(vendorId)) {
      throw new Error("Vendor is not a participant");
    }

    // Check if bid is lower than current lowest bid
    const itemBids = auction.bids.filter((b) => b.itemName === itemName);
    const currentLowest = itemBids
      .filter((b) => b.status === "ACTIVE" || b.status === "WINNING")
      .sort((a, b) => a.bidAmount - b.bidAmount)[0];

    if (currentLowest && bidAmount >= currentLowest.bidAmount) {
      throw new Error("Bid must be lower than current lowest bid");
    }

    // Check reserve price
    const item = auction.items.find((i) => i.itemName === itemName);
    if (item?.reservePrice && bidAmount < item.reservePrice) {
      throw new Error("Bid is below reserve price");
    }

    const bidId = `bid-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const bid: AuctionBid = {
      id: bidId,
      auctionId,
      vendorId,
      vendorName,
      itemName,
      bidAmount,
      currency,
      submittedAt: new Date().toISOString(),
      status: "ACTIVE",
    };

    // Mark previous winning bid as outbid
    if (currentLowest) {
      currentLowest.status = "OUTBID";
    }

    bid.status = "WINNING";
    auction.bids.push(bid);

    // Store bids
    if (!auctionBids.has(auctionId)) {
      auctionBids.set(auctionId, []);
    }
    auctionBids.get(auctionId)!.push(bid);

    auctions.set(auctionId, auction);

    // Publish event
    await eventBus.publish({
      type: "procurement.sourcing.auction.bid.submitted",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        auctionId,
        bidId,
        tenantId,
        vendorId,
        vendorName,
        itemName,
        bidAmount,
        currency,
      },
    } as DomainEvent);

    return bid;
  }

  /**
   * Close auction and determine winners
   */
  async closeAuction(
    auctionId: string,
    tenantId: string,
    closedBy: string,
  ): Promise<Auction> {
    const auction = auctions.get(auctionId);
    if (!auction || auction.tenantId !== tenantId) {
      throw new Error("Auction not found");
    }

    if (auction.status !== "LIVE") {
      throw new Error("Auction is not live");
    }

    // Determine winners for each item
    const winningBids: Array<{
      itemName: string;
      vendorId: string;
      vendorName: string;
      bidAmount: number;
    }> = [];

    auction.items.forEach((item) => {
      const itemBids = auction.bids
        .filter((b) => b.itemName === item.itemName && b.status === "WINNING")
        .sort((a, b) => a.bidAmount - b.bidAmount);

      if (itemBids.length > 0) {
        const winner = itemBids[0];
        winningBids.push({
          itemName: item.itemName,
          vendorId: winner.vendorId,
          vendorName: winner.vendorName,
          bidAmount: winner.bidAmount,
        });
      }
    });

    auction.status = "CLOSED";
    auction.winningBids = winningBids;

    auctions.set(auctionId, auction);

    // Publish event
    await eventBus.publish({
      type: "procurement.sourcing.auction.closed",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        auctionId,
        tenantId,
        winningBids,
        closedBy,
      },
    } as DomainEvent);

    return auction;
  }

  /**
   * Get sourcing request by ID
   */
  async getSourcingRequest(
    requestId: string,
    tenantId: string,
  ): Promise<SourcingRequest | null> {
    const request = sourcingRequests.get(requestId);
    if (!request || request.tenantId !== tenantId) {
      return null;
    }
    return request;
  }

  /**
   * Get auction by ID
   */
  async getAuction(
    auctionId: string,
    tenantId: string,
  ): Promise<Auction | null> {
    const auction = auctions.get(auctionId);
    if (!auction || auction.tenantId !== tenantId) {
      return null;
    }
    return auction;
  }
}

// Singleton instance
export const sourcingService = new SourcingService();
