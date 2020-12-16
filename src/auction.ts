import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { Auction, Bid, User, Notification, BidDetails } from "../generated/schema";
import { 
    CancelBid,
    CancelDeal,
    FundAuction,
    IsKillable,
    Killed,
    NewBid,
    NewEndTime,
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

    let user = User.load(auction.owner);

    if (user == null) {
        createUserIfNull(auction.owner);
        user = User.load(auction.owner);
    }

    let auctionsAsOwner = user.auctionsAsOwner;
    user.auctionsAsOwner = auctionsAsOwner.plus(BigInt.fromI32(1));
    user.save();
}

export function handleNewBid(event: NewBid): void {
    createUserIfNull(event.params.bidder.toHexString());
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

            let user = User.load(event.params.bidder.toHexString());

            let biddedAuctions = user.biddedAuctions;
            user.biddedAuctions = biddedAuctions.plus(BigInt.fromI32(1));

            let userBidsArray = user.bids;
            userBidsArray.push(bid.id);
            user.bids = userBidsArray;

            user.save();
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

        let user = User.load(bidder.toHexString());

        let totalBids = user.totalBids;
        user.totalBids = totalBids.plus(BigInt.fromI32(1));
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

export function handleNewEndTime(event: NewEndTime): void {
    let auction = Auction.load(event.address.toHexString());

    if (auction != null) {
        auction.endTime = event.params.newEndTime;
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

        let bidsArray = auction.bids as string[];
        if (bidsArray.length > 0) {
            let lastBidDetailsId = bidsArray[bidsArray.length - 1];
            let bidDetails = BidDetails.load(lastBidDetailsId as string);
            let lastBidId = bidDetails.bidEntity;
            let bid = Bid.load(lastBidId);
            bid.isCancel = true;
            bid.save();
        }

        let maxBidder = User.load(auction.maxBidder);
        let badDeals = maxBidder.bidderBadDeals;
        maxBidder.bidderBadDeals = badDeals.plus(BigInt.fromI32(1));
        maxBidder.save();
    }
}

export function handlePayDeal(event: PayDeal): void {
    let auction = Auction.load(event.address.toHexString());

    if (auction != null) {
        auction.isDealPaid = true;
        auction.isOpen = false;
        auction.save();

        let bidsArray = auction.bids as string[];
        if (bidsArray.length > 0) {
            let lastBidDetailsId = bidsArray[bidsArray.length - 1];
            let bidDetails = BidDetails.load(lastBidDetailsId as string);
            let lastBidId = bidDetails.bidEntity;
            let bid = Bid.load(lastBidId);
            bid.isCancel = true;
            bid.save();
        }

        let maxBidder = User.load(auction.maxBidder);
        let goodDeals = maxBidder.bidderGoodDeals;
        maxBidder.bidderGoodDeals = goodDeals.plus(BigInt.fromI32(1));
        maxBidder.save();
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