package com.example.demo;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.business.AppUserService;
import com.example.demo.business.OrderService;
import com.example.demo.business.PartnerService;
import com.example.demo.business.ProductService;
import com.example.demo.business.SupportTicketService;
import com.example.demo.data.domain.Address;
import com.example.demo.data.domain.Partner;
import com.example.demo.data.domain.Product;
import com.example.demo.data.domain.TicketMessage;
import com.example.demo.data.domain.TicketState;
import com.example.demo.data.domain.TicketUrgency;

import jakarta.annotation.PostConstruct;

@SpringBootApplication
@RestController
public class fluxTrackApplication {

	@Autowired
	private ProductService productService;
	@Autowired
	private PartnerService partnerService;
	@Autowired
	private OrderService orderService;
	@Autowired
	private SupportTicketService ticketService;
	@Autowired
	private AppUserService appUserService;

	public static void main(String[] args) {
		SpringApplication.run(fluxTrackApplication.class, args);
	}

	@GetMapping("/welcome")
	public String getWelcomeString() {
		return "Hello World";
	}

	/**
	 * Seeds demo data on first boot.
	 * H2 (dev): DB is wiped on every restart, so this runs every time.
	 * PostgreSQL (prod): data persists, so the guard skips seeding after the first run.
	 */
	@PostConstruct
	public void initTestData() throws Exception {
		if (!partnerService.getAllPartners().isEmpty()) {
			return;
		}

		// --- Partner 1: Wylaade GmbH ---
		Partner wylaade = new Partner();
		wylaade.setPartnerName("Wylaade GmbH");
		wylaade.setPartnerEmail("info@wylaade.ch");
		wylaade.setPartnerPhone("+41 77 509 66 07");

		Address wylaadeAddress = new Address();
		wylaadeAddress.setName("Wylaade GmbH");
		wylaadeAddress.setStreet("Hauptstrasse");
		wylaadeAddress.setNumber("31");
		wylaadeAddress.setCity("Oberwil");
		wylaadeAddress.setZip(4104L);
		wylaadeAddress.setCountry("Switzerland");

		List<Address> wylaadeAddresses = new ArrayList<>();
		wylaadeAddresses.add(wylaadeAddress);
		wylaade.setPartnerAddress(wylaadeAddresses);
		partnerService.addPartner(wylaade);
		Long wylaadeId = wylaade.getPartnerID();

		productService.addProduct(makeProduct("00150", "Badaceli 2016 DOC Priorat",     27.50, 32, wylaadeId));
		productService.addProduct(makeProduct("00083", "Baselbieter Kerner 2022",        22.50,  0, wylaadeId));
		productService.addProduct(makeProduct("00301", "Palmeri Blu 2014",               39.50, 10, wylaadeId));
		productService.addProduct(makeProduct("00033", "Balatoni C-Cuvée 2019",          27.50, 16, wylaadeId));
		productService.addProduct(makeProduct("00014", "Zambartas Maratheftiko 2019",    29.50, 22, wylaadeId));
		productService.addProduct(makeProduct("00091", "Domaine Mont d'Or Petite Arvine 2022", 32.00, 18, wylaadeId));
		productService.addProduct(makeProduct("00102", "Pinot Noir Twannberg 2021",      28.50, 12, wylaadeId));
		productService.addProduct(makeProduct("00115", "Riesling-Sylvaner 2023",         18.90, 25, wylaadeId));
		productService.addProduct(makeProduct("00128", "Cornalin du Valais 2020",        42.00,  8, wylaadeId));
		productService.addProduct(makeProduct("00134", "Champagne Bollinger Special Cuvée NV", 75.00, 0, wylaadeId));

		// --- Partner 2: Drachehöhli GmbH ---
		Partner drachehöhli = new Partner();
		drachehöhli.setPartnerName("Drachehöhli GmbH");
		drachehöhli.setPartnerEmail("info@drachehöhli.ch");
		drachehöhli.setPartnerPhone("+41 61 401 44 44");

		Address drachehöhliAddress = new Address();
		drachehöhliAddress.setName("Drachehöhli GmbH");
		drachehöhliAddress.setStreet("Passage");
		drachehöhliAddress.setNumber("6");
		drachehöhliAddress.setCity("Oberwil");
		drachehöhliAddress.setZip(4104L);
		drachehöhliAddress.setCountry("Switzerland");

		List<Address> drachehöhliAddresses = new ArrayList<>();
		drachehöhliAddresses.add(drachehöhliAddress);
		drachehöhli.setPartnerAddress(drachehöhliAddresses);
		partnerService.addPartner(drachehöhli);
		Long drachehöhliId = drachehöhli.getPartnerID();

		productService.addProduct(makeProduct("00501", "Pokémon Day 2026 Collection (DE+EN)",       25.90, 48, drachehöhliId));
		productService.addProduct(makeProduct("00502", "Azul",                                      36.00,  4, drachehöhliId));
		productService.addProduct(makeProduct("00503", "Magic - Lorwyn Eclipsed Draft Night (EN)",  89.90,  0, drachehöhliId));
		productService.addProduct(makeProduct("00504", "Naruto TCG: Special Pack EN",               32.90, 12, drachehöhliId));
		productService.addProduct(makeProduct("00505", "Wingspan + European Expansion",             79.90,  9, drachehöhliId));
		productService.addProduct(makeProduct("00510", "Dungeons & Dragons Starter Set",            24.90, 35, drachehöhliId));
		productService.addProduct(makeProduct("00518", "Pandemic Legacy: Season 1",                 64.90,  0, drachehöhliId));
		productService.addProduct(makeProduct("00525", "7 Wonders Duel",                            32.50, 14, drachehöhliId));
		productService.addProduct(makeProduct("00531", "MTG: Commander Deck Pack",                  39.90, 22, drachehöhliId));

		// --- Application users ---
		appUserService.seedUser("wylaade",      "password", "PARTNER", wylaadeId,      "Wylaade GmbH",     "/images/partners/wylaade.png");
		appUserService.seedUser("drachehoehli", "password", "PARTNER", drachehöhliId,  "Drachehöhli GmbH", "/images/partners/drachehoehli.png");
		appUserService.seedUser("admin",        "admin",    "ADMIN",   null,           "Administrator",    "/images/partners/fluxed.png");

		// --- Historical orders (UC 304) ---
		List<Product> allProductsForSeed = productService.getAllProducts();
		LocalDateTime now = LocalDateTime.now();

		Map<String, Product> bySku = new HashMap<>();
		for (Product p : allProductsForSeed) {
			bySku.put(p.getProductSKU(), p);
		}

		seedOrderIfPresent(bySku, "00150", 2, now.minusDays(28).withHour(10).withMinute(15));
		seedOrderIfPresent(bySku, "00150", 1, now.minusDays(21).withHour(14).withMinute(40));
		seedOrderIfPresent(bySku, "00301", 1, now.minusDays(18).withHour(11).withMinute(5));
		seedOrderIfPresent(bySku, "00033", 2, now.minusDays(15).withHour(16).withMinute(20));
		seedOrderIfPresent(bySku, "00014", 3, now.minusDays(12).withHour(9).withMinute(50));
		seedOrderIfPresent(bySku, "00150", 1, now.minusDays(9).withHour(13).withMinute(10));
		seedOrderIfPresent(bySku, "00014", 1, now.minusDays(6).withHour(17).withMinute(30));
		seedOrderIfPresent(bySku, "00301", 2, now.minusDays(3).withHour(10).withMinute(45));

		seedOrderIfPresent(bySku, "00091", 4, now.minusDays(55).withHour(11).withMinute(20));
		seedOrderIfPresent(bySku, "00102", 2, now.minusDays(50).withHour(15).withMinute(10));
		seedOrderIfPresent(bySku, "00115", 8, now.minusDays(45).withHour(9).withMinute(40));
		seedOrderIfPresent(bySku, "00128", 1, now.minusDays(40).withHour(14).withMinute(25));
		seedOrderIfPresent(bySku, "00091", 3, now.minusDays(35).withHour(16).withMinute(50));
		seedOrderIfPresent(bySku, "00102", 5, now.minusDays(23).withHour(12).withMinute(15));
		seedOrderIfPresent(bySku, "00115", 12, now.minusDays(17).withHour(10).withMinute(30));
		seedOrderIfPresent(bySku, "00083", 4, now.minusDays(13).withHour(15).withMinute(45));
		seedOrderIfPresent(bySku, "00091", 2, now.minusDays(8).withHour(11).withMinute(10));
		seedOrderIfPresent(bySku, "00128", 1, now.minusDays(5).withHour(14).withMinute(5));
		seedOrderIfPresent(bySku, "00301", 1, now.minusDays(1).withHour(16).withMinute(30));

		seedOrderIfPresent(bySku, "00501", 6, now.minusDays(27).withHour(11).withMinute(0));
		seedOrderIfPresent(bySku, "00501", 12, now.minusDays(20).withHour(15).withMinute(20));
		seedOrderIfPresent(bySku, "00504", 2, now.minusDays(17).withHour(14).withMinute(5));
		seedOrderIfPresent(bySku, "00502", 1, now.minusDays(14).withHour(18).withMinute(0));
		seedOrderIfPresent(bySku, "00501", 6, now.minusDays(10).withHour(12).withMinute(30));
		seedOrderIfPresent(bySku, "00504", 4, now.minusDays(7).withHour(16).withMinute(15));
		seedOrderIfPresent(bySku, "00502", 1, now.minusDays(2).withHour(11).withMinute(45));

		seedOrderIfPresent(bySku, "00505", 3, now.minusDays(58).withHour(13).withMinute(15));
		seedOrderIfPresent(bySku, "00510", 8, now.minusDays(52).withHour(10).withMinute(30));
		seedOrderIfPresent(bySku, "00518", 1, now.minusDays(48).withHour(15).withMinute(0));
		seedOrderIfPresent(bySku, "00525", 2, now.minusDays(42).withHour(11).withMinute(45));
		seedOrderIfPresent(bySku, "00531", 6, now.minusDays(38).withHour(14).withMinute(20));
		seedOrderIfPresent(bySku, "00501", 10, now.minusDays(32).withHour(16).withMinute(10));
		seedOrderIfPresent(bySku, "00510", 4, now.minusDays(25).withHour(12).withMinute(5));
		seedOrderIfPresent(bySku, "00525", 3, now.minusDays(18).withHour(15).withMinute(35));
		seedOrderIfPresent(bySku, "00531", 5, now.minusDays(11).withHour(10).withMinute(20));
		seedOrderIfPresent(bySku, "00518", 2, now.minusDays(7).withHour(14).withMinute(40));
		seedOrderIfPresent(bySku, "00510", 2, now.minusDays(4).withHour(11).withMinute(55));
		seedOrderIfPresent(bySku, "00505", 1, now.minusDays(1).withHour(16).withMinute(0));

		// --- Support tickets (UC 107) ---

		ticketService.seedTicket(
			wylaadeId,
			"Cannot log in after password reset",
			TicketUrgency.HIGH,
			TicketState.OPEN,
			now.minusDays(2).withHour(9).withMinute(12),
			Arrays.asList(
				new TicketMessage("wylaade",
					"Hi, since I reset my password yesterday I can no longer log in. The error says \"invalid credentials\" but I'm sure the password is correct.",
					now.minusDays(2).withHour(9).withMinute(12))
			)
		);

		ticketService.seedTicket(
			wylaadeId,
			"Stock count for Palmeri Blu wrong after import",
			TicketUrgency.MEDIUM,
			TicketState.ANSWERED,
			now.minusDays(5).withHour(14).withMinute(30),
			Arrays.asList(
				new TicketMessage("wylaade",
					"After the bulk update yesterday the stock for Palmeri Blu 2014 shows 10 units but in our warehouse we have 25. Could you check what went wrong?",
					now.minusDays(5).withHour(14).withMinute(30)),
				new TicketMessage("admin",
					"Hello, thanks for reporting this. We've reviewed the import log and the issue was a mismatched SKU. You should now be able to adjust the stock manually to 25. Please confirm if this works for you.",
					now.minusDays(5).withHour(16).withMinute(45))
			)
		);

		ticketService.seedTicket(
			drachehöhliId,
			"How do I export a price list?",
			TicketUrgency.LOW,
			TicketState.RESOLVED,
			now.minusDays(10).withHour(11).withMinute(0),
			Arrays.asList(
				new TicketMessage("drachehoehli",
					"Hi team, is there a way to export the current price list as PDF or Excel? I'd like to share it with our store staff.",
					now.minusDays(10).withHour(11).withMinute(0)),
				new TicketMessage("admin",
					"Hi, the export feature is on our roadmap but not yet available. As a workaround you can use the partner overview page and copy-paste into your spreadsheet tool. Let me know if that works for now.",
					now.minusDays(10).withHour(13).withMinute(20)),
				new TicketMessage("drachehoehli",
					"Problem confirmed as resolved.",
					now.minusDays(9).withHour(8).withMinute(15))
			)
		);

		ticketService.seedTicket(
			drachehöhliId,
			"Welcome onboarding — account setup completed",
			TicketUrgency.LOW,
			TicketState.COMPLETED,
			now.minusDays(45).withHour(10).withMinute(0),
			Arrays.asList(
				new TicketMessage("drachehoehli",
					"First message to confirm our account is set up correctly. Everything looks fine on our side.",
					now.minusDays(45).withHour(10).withMinute(0)),
				new TicketMessage("admin",
					"Welcome to fluxed! Glad to have you onboard. If you run into anything, this is the right place to ask.",
					now.minusDays(45).withHour(11).withMinute(30)),
				new TicketMessage("drachehoehli",
					"Problem confirmed as resolved.",
					now.minusDays(44).withHour(9).withMinute(45)),
				new TicketMessage("admin",
					"Ticket closed as completed.",
					now.minusDays(40).withHour(14).withMinute(0))
			)
		);
	}

	private void seedOrderIfPresent(Map<String, Product> bySku, String sku, int quantity, LocalDateTime when) {
		Product p = bySku.get(sku);
		if (p != null) {
			orderService.seedOrder(p, quantity, when);
		}
	}

	private static Product makeProduct(String sku, String name, double price, int qty, Long partnerId) {
		Product p = new Product();
		p.setProductSKU(sku);
		p.setProductName(name);
		p.setProductPrice(price);
		p.setProductQuantity(qty);
		p.setProductPartnerID(partnerId);
		return p;
	}
}