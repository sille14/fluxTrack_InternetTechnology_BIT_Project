package ch.fluxed.fluxtrack.business;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import ch.fluxed.fluxtrack.data.domain.Partner;
import ch.fluxed.fluxtrack.data.repository.PartnerRepository;

/**
 * Partner CRUD operations with basic validation.
 * Partners are the top-level entity that products, orders, and users belong to.
 */
@Service
public class PartnerService {

    @Autowired
    private PartnerRepository partnerRepository;

    public Partner getPartnerById(Long id) {
        return partnerRepository.findByPartnerID(id);
    }

    public List<Partner> getAllPartners() {
        return partnerRepository.findAll();
    }

    public Partner addPartner(Partner partner) {
        if (partner.getPartnerName() == null || partner.getPartnerName().isEmpty()) {
            throw new IllegalArgumentException("Partner name cannot be null or empty");
        }
        if (partner.getPartnerEmail() == null || partner.getPartnerEmail().isEmpty()) {
            throw new IllegalArgumentException("Partner email cannot be null or empty");
        }
        return partnerRepository.save(partner);
    }

    public Partner updatePartner(Long id, Partner updatedPartner) {
        Partner existing = partnerRepository.findByPartnerID(id);
        if (existing == null) {
            throw new IllegalArgumentException("Partner with id " + id + " not found");
        }
        if (updatedPartner.getPartnerName() != null) {
            if (updatedPartner.getPartnerName().isEmpty()) {
                throw new IllegalArgumentException("Partner name cannot be empty");
            }
            existing.setPartnerName(updatedPartner.getPartnerName());
        }
        if (updatedPartner.getPartnerEmail() != null) {
            if (updatedPartner.getPartnerEmail().isEmpty()) {
                throw new IllegalArgumentException("Partner email cannot be empty");
            }
            existing.setPartnerEmail(updatedPartner.getPartnerEmail());
        }
        if (updatedPartner.getPartnerPhone() != null) {
            existing.setPartnerPhone(updatedPartner.getPartnerPhone());
        }
        if (updatedPartner.getPartnerAddress() != null) {
            existing.setPartnerAddress(updatedPartner.getPartnerAddress());
        }
        return partnerRepository.save(existing);
    }

    public void deletePartner(Long id) {
        Partner existing = partnerRepository.findByPartnerID(id);
        if (existing == null) {
            throw new IllegalArgumentException("Partner with id " + id + " not found");
        }
        partnerRepository.delete(existing);
    }
}