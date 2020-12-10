import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { Auction, Bid, User, Notification, BidDetails } from "../generated/schema";
import { 
    CancelBid,
    CancelDeal,
    FundAuction,
    IsKillable,
    Killed,
    NewBid,
    PayDeal,
    UpdateBid
} from "../generated/templates/Auction/Auction";
import { createUserIfNull } from "./user";

export function handleFundAuction(event: FundAuction): void {
    let auction = Auction.load(event.address.toHexString());

    if (auction != null) {
        auction.isOpen = true;
        auction.save();
    }
}

export function handleNewBid(event: NewBid): void {
    let auction = Auction.load(event.address.toHexString());

    if (auction != null) {
        auction.maxBid = event.params.bid;
        auction.maxBidder = event.params.bidder.toHexString();
        
        let bidId = event.address.toHexString().concat("-").concat(event.params.bidder.toHexString());
        createNotification(
            auction.id, 
            event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toHexString()), 
            event.params.bid, 
            event.params.bidder.toHexString(), 
            event.block.timestamp
        );
        let bid = Bid.load(bidId);

        if (bid == null) {
            log.info("----NEW BID------: " + event.params.bidder.toHexString(), [])
            bid = new Bid(bidId);
            bid.auction = auction.id;
            bid.bid = event.params.bid;
            bid.bidder = event.params.bidder.toHexString();
            bid.bids = [];
            bid.isCancel = false;
            bid.auctionToken = auction.auctionToken;
            bid.bidToken = auction.bidToken;
            bid.timestamp = event.block.timestamp;
            bid.save();
        }

        createBidDetails(
            event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toHexString()),
            event.params.bidder,
            event.params.bid,
            event.block.timestamp,
            bid as Bid
        );
        
        let bidDetails = BidDetails.load(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toHexString()));

        let bidPrices = bid.bids;
        bidPrices.push(bidDetails.id)
        bid.bids = bidPrices;
        bid.save();

        let bidsArray = auction.bids;
        bidsArray.push(bidDetails.id);
        auction.bids = bidsArray;
        auction.save();

        createUserIfNull(event.params.bidder.toHexString());
        let user = User.load(event.params.bidder.toHexString());
        let userBidsArray = user.bids;
        userBidsArray.push(bid.id);
        user.bids = userBidsArray;
        user.save();
    }
}

function createNotification(
    auctionId: string, 
    notificationId: string, 
    newBid: BigInt, 
    newBidder: string,
    timestamp: BigInt
): void {
    let auction = Auction.load(auctionId);

    if (auction != null) {
        if (auction.maxBidder != null){
            let notification = Notification.load(notificationId);

            if (notification == null) {
                notification = new Notification(notificationId);

                notification.auction = auction.id;
                notification.bid = auction.maxBid;
                notification.bidder = auction.maxBidder;
                notification.newBid = newBid;
                notification.newBidder = newBidder;
                notification.timestamp = timestamp;

                notification.save();
            }
        }
    }
}

function createBidDetails(
    id: string,
    bidder: Address,
    bid: BigInt,
    timestamp: BigInt,
    bidEntity: Bid
): void {
    let bidDetails = BidDetails.load(id);

    if (bidDetails == null) {
        bidDetails = new BidDetails(id);
        bidDetails.bid = bid;
        bidDetails.bidder = bidder.toHexString();
        bidDetails.timestamp = timestamp;
        bidDetails.bidEntity = bidEntity.id;

        bidDetails.save();
    }
}

export function handleUpdateBid(event: UpdateBid): void {
    let bidId = event.address.toHexString().concat("-").concat(event.params.bidder.toHexString());
    createNotification(
        event.address.toHexString(), 
        event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toHexString()), 
        event.params.bid, 
        event.params.bidder.toHexString(), 
        event.block.timestamp
    );
    let bid = Bid.load(bidId);

    if (bid != null) {
        createBidDetails(
            event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toHexString()),
            event.params.bidder,
            event.params.bid,
            event.block.timestamp,
            bid as Bid
        );
        let bidDetails = BidDetails.load(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toHexString()));
        bid.bid = event.params.bid;
        let bidPrices = bid.bids;
        bidPrices.push(bidDetails.id);
        bid.bids = bidPrices;
        bid.timestamp = event.block.timestamp;
        bid.save();
    }

    let auction = Auction.load(event.address.toHexString());
    let bidDetails = BidDetails.load(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toHexString()));

    if (auction != null) {
        auction.maxBid = event.params.bid;
        auction.maxBidder = event.params.bidder.toHexString();
        let bidsArray = auction.bids;
        bidsArray.push(bidDetails.id);
        auction.bids = bidsArray;
        auction.save();
    }
}

export function handleCancelBid(event: CancelBid): void {
    let bidId = event.address.toHexString().concat("-").concat(event.params.bidder.toHexString());
    let bid = Bid.load(bidId);

    if (bid != null) {
        bid.isCancel = true;
        bid.save();
    }
}

export function handleCancelDeal(event: CancelDeal): void {
    let auction = Auction.load(event.address.toHexString());

    if (auction != null) {
        auction.isDealCancelled = true;
        auction.isOpen = false;
        auction.save();
    }
}

export function handlePayDeal(event: PayDeal): void {
    let auction = Auction.load(event.address.toHexString());

    if (auction != null) {
        auction.isDealPaid = true;
        auction.isOpen = false;
        auction.save();
    }
}

export function handleIsKillable(event: IsKillable): void {
    let auction = Auction.load(event.address.toHexString());

    if (auction != null) {
        auction.isKillable = true;
        auction.save();
    }
}

export function handleKilled(event: Killed): void {
    let auction = Auction.load(event.address.toHexString());

    if (auction != null) {
        auction.isKilled = true;
        auction.save();
    }
}