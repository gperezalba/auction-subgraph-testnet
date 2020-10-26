import { Auction, Bid, User } from "../generated/schema";
import { 
    CancelBid,
    CancelDeal,
    FundAuction,
    NewBid,
    Pay,
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
        let bid = Bid.load(bidId);

        if (bid == null) {
            bid = new Bid(bidId);
            bid.auction = auction.id;
            bid.bid = event.params.bid;
            bid.bidder = event.params.bidder.toHexString();
            bid.isCancel = false;
            bid.save();
        }

        let bidsArray = auction.bids;
        bidsArray.push(bid.id);
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

export function handleUpdateBid(event: UpdateBid): void {
    let bidId = event.address.toHexString().concat("-").concat(event.params.bidder.toHexString());
    let bid = Bid.load(bidId);

    if (bid == null) {
        bid.bid = event.params.bid;
        bid.save();
    }
}

export function handleCancelBid(event: CancelBid): void {
    let bidId = event.address.toHexString().concat("-").concat(event.params.bidder.toHexString());
    let bid = Bid.load(bidId);

    if (bid == null) {
        bid.isCancel = true;
        bid.save();
    }
}

export function handleCancelDeal(event: CancelDeal): void {
    
}

export function handlePay(event: Pay): void {
    
}

export function handlePayDeal(event: PayDeal): void {
    
}

