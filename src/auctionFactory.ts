import { Auction, Token } from "../generated/schema"
import { NewAuction } from "../generated/AuctionFactory/AuctionFactory"
import { Auction as AuctionTemplate } from "../generated/templates"
import { BigInt } from "@graphprotocol/graph-ts";

export function handleNewAuction(event: NewAuction): void {
    let auction = Auction.load(event.params.newAuction.toHexString());

    if (auction == null) {
        auction = new Auction(event.params.newAuction.toHexString());
    }

    let tokens = event.params.tokens;
    let auctionToken = Token.load(tokens[0].toHexString());

    auction.owner = event.params.owner.toHexString();
    auction.auctionToken = auctionToken.id;
    auction.bidToken = tokens[1].toHexString();
    auction.auctionAmount = event.params.auctionAmountOrId;

    if (auctionToken.tokenKind == BigInt.fromI32(2)) {
        let collectableId = auctionToken.id.concat("-").concat(event.params.auctionAmountOrId.toString());
        auction.auctionCollectable = collectableId;
    } else if (auctionToken.tokenKind == BigInt.fromI32(3)) {
        auction.auctionPackable = event.params.auctionTokenId.toHexString();
    }

    let settings = event.params.settings;

    auction.category = auctionToken.tokenKind;
    auction.bidPrice = settings[0].div(BigInt.fromI32(10));
    auction.minValue = settings[0];
    auction.maxBid = settings[0];
    auction.endTime = settings[1];
    auction.auditor = event.params.auditor;

    auction.save();

    AuctionTemplate.create(event.params.newAuction);
}