-- ============================================================================
-- Nepal Elections 2026 - Seed Data
-- Generated: 2026-01-16T16:29:00.478Z
-- ============================================================================

BEGIN;

-- Parties
INSERT INTO parties (id, name, name_nepali, short_name, color, ideology, leader, founded, symbol, website, logo_url)
VALUES (
  'nc',
  'Nepali Congress',
  'नेपाली कांग्रेस',
  'NC',
  '#1e88e5',
  'Center-left, Social Democracy',
  'Sher Bahadur Deuba',
  1947,
  'tree',
  'https://nepalicongress.org',
  'Nepali_Congress.png'
);

INSERT INTO parties (id, name, name_nepali, short_name, color, ideology, leader, founded, symbol, website, logo_url)
VALUES (
  'uml',
  'CPN (UML)',
  'नेकपा (एमाले)',
  'UML',
  '#d32f2f',
  'Left, Communist',
  'K.P. Sharma Oli',
  1991,
  'sun',
  'https://cpnuml.org',
  'cpnuml.png'
);

INSERT INTO parties (id, name, name_nepali, short_name, color, ideology, leader, founded, symbol, website, logo_url)
VALUES (
  'maoist',
  'CPN (Maoist Centre)',
  'नेकपा (माओवादी केन्द्र)',
  'Maoist',
  '#c62828',
  'Left, Maoist',
  'Pushpa Kamal Dahal',
  1994,
  'hammer-sickle',
  NULL,
  'mao.png'
);

INSERT INTO parties (id, name, name_nepali, short_name, color, ideology, leader, founded, symbol, website, logo_url)
VALUES (
  'rsp',
  'Rastriya Swatantra Party',
  'राष्ट्रिय स्वतन्त्र पार्टी',
  'RSP',
  '#7b1fa2',
  'Anti-corruption, Liberal',
  'Rabi Lamichhane',
  2022,
  'key',
  NULL,
  'rsp.png'
);

INSERT INTO parties (id, name, name_nepali, short_name, color, ideology, leader, founded, symbol, website, logo_url)
VALUES (
  'jsp',
  'Janata Samajwadi Party',
  'जनता समाजवादी पार्टी',
  'JSP',
  '#388e3c',
  'Center-left, Federalist',
  'Upendra Yadav',
  2020,
  'chair',
  NULL,
  'janata_Samajparty_Party_Nepal.png'
);

INSERT INTO parties (id, name, name_nepali, short_name, color, ideology, leader, founded, symbol, website, logo_url)
VALUES (
  'genz',
  'Nawa Nirman Party',
  'नवनिर्माण पार्टी',
  'GenZ',
  '#00bcd4',
  'Youth, Anti-establishment',
  'Kishori Karki',
  2025,
  'sunrise',
  NULL,
  NULL
);

-- Constituencies
INSERT INTO constituencies (id, name, name_nepali, province, district, constituency_type, registered_voters, center, bounds)
VALUES (
  'ktm-1',
  'Kathmandu-1',
  'काठमाडौं-१',
  'Bagmati',
  'Kathmandu',
  'FPTP',
  89234,
  ST_SetSRID(ST_MakePoint(85.324, 27.7172), 4326)::geography,
  ST_SetSRID(ST_GeomFromText('POLYGON((85.31 27.705, 85.338 27.705, 85.338 27.729, 85.31 27.729, 85.31 27.705))'), 4326)::geography
);

INSERT INTO constituencies (id, name, name_nepali, province, district, constituency_type, registered_voters, center, bounds)
VALUES (
  'ktm-2',
  'Kathmandu-2',
  'काठमाडौं-२',
  'Bagmati',
  'Kathmandu',
  'FPTP',
  76543,
  ST_SetSRID(ST_MakePoint(85.35, 27.7), 4326)::geography,
  ST_SetSRID(ST_GeomFromText('POLYGON((85.338 27.685, 85.362 27.685, 85.362 27.715, 85.338 27.715, 85.338 27.685))'), 4326)::geography
);

INSERT INTO constituencies (id, name, name_nepali, province, district, constituency_type, registered_voters, center, bounds)
VALUES (
  'ktm-3',
  'Kathmandu-3',
  'काठमाडौं-३',
  'Bagmati',
  'Kathmandu',
  'FPTP',
  82100,
  ST_SetSRID(ST_MakePoint(85.315, 27.685), 4326)::geography,
  ST_SetSRID(ST_GeomFromText('POLYGON((85.3 27.67, 85.33 27.67, 85.33 27.7, 85.3 27.7, 85.3 27.67))'), 4326)::geography
);

INSERT INTO constituencies (id, name, name_nepali, province, district, constituency_type, registered_voters, center, bounds)
VALUES (
  'lalitpur-1',
  'Lalitpur-1',
  'ललितपुर-१',
  'Bagmati',
  'Lalitpur',
  'FPTP',
  71234,
  ST_SetSRID(ST_MakePoint(85.3247, 27.6588), 4326)::geography,
  ST_SetSRID(ST_GeomFromText('POLYGON((85.31 27.645, 85.34 27.645, 85.34 27.672, 85.31 27.672, 85.31 27.645))'), 4326)::geography
);

INSERT INTO constituencies (id, name, name_nepali, province, district, constituency_type, registered_voters, center, bounds)
VALUES (
  'bhaktapur-1',
  'Bhaktapur-1',
  'भक्तपुर-१',
  'Bagmati',
  'Bhaktapur',
  'FPTP',
  65890,
  ST_SetSRID(ST_MakePoint(85.4298, 27.671), 4326)::geography,
  ST_SetSRID(ST_GeomFromText('POLYGON((85.41 27.655, 85.45 27.655, 85.45 27.687, 85.41 27.687, 85.41 27.655))'), 4326)::geography
);

-- Venues
INSERT INTO venues (id, name, name_nepali, address, location, constituency_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Basantapur Durbar Square',
  'बसन्तपुर दरबार क्षेत्र',
  'Basantapur, Kathmandu',
  ST_SetSRID(ST_MakePoint(85.3066, 27.7042), 4326)::geography,
  'ktm-1'
);

INSERT INTO venues (id, name, name_nepali, address, location, constituency_id)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Nepal Academy Hall',
  'नेपाल प्रज्ञा प्रतिष्ठान हल',
  'Kamaladi, Kathmandu',
  ST_SetSRID(ST_MakePoint(85.32, 27.7089), 4326)::geography,
  'ktm-2'
);

INSERT INTO venues (id, name, name_nepali, address, location, constituency_id)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Ratna Park to Singha Durbar',
  'रत्न पार्कदेखि सिंहदरबार',
  'Ratna Park, Kathmandu',
  ST_SetSRID(ST_MakePoint(85.315, 27.705), 4326)::geography,
  'ktm-1'
);

INSERT INTO venues (id, name, name_nepali, address, location, constituency_id)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'Bhaktapur Municipality Hall',
  'भक्तपुर नगरपालिका हल',
  'Durbar Square, Bhaktapur',
  ST_SetSRID(ST_MakePoint(85.4279, 27.6722), 4326)::geography,
  'bhaktapur-1'
);

INSERT INTO venues (id, name, name_nepali, address, location, constituency_id)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  'Patan Durbar Square',
  'पाटन दरबार क्षेत्र',
  'Patan, Lalitpur',
  ST_SetSRID(ST_MakePoint(85.325, 27.6727), 4326)::geography,
  'lalitpur-1'
);

INSERT INTO venues (id, name, name_nepali, address, location, constituency_id)
VALUES (
  '00000000-0000-0000-0000-000000000006',
  'Kalimati Area',
  'कालीमाटी क्षेत्र',
  'Kalimati, Kathmandu',
  ST_SetSRID(ST_MakePoint(85.302, 27.695), 4326)::geography,
  'ktm-3'
);

INSERT INTO venues (id, name, name_nepali, address, location, constituency_id)
VALUES (
  '00000000-0000-0000-0000-000000000007',
  'Hotel Himalaya',
  'होटल हिमालय',
  'Kupandole, Lalitpur',
  ST_SetSRID(ST_MakePoint(85.318, 27.685), 4326)::geography,
  'lalitpur-1'
);

INSERT INTO venues (id, name, name_nepali, address, location, constituency_id)
VALUES (
  '00000000-0000-0000-0000-000000000008',
  'Tundikhel Ground',
  'टुँडिखेल मैदान',
  'Tundikhel, Kathmandu',
  ST_SetSRID(ST_MakePoint(85.316, 27.702), 4326)::geography,
  'ktm-2'
);

INSERT INTO venues (id, name, name_nepali, address, location, constituency_id)
VALUES (
  '00000000-0000-0000-0000-000000000009',
  'Dattatreya Square',
  'दत्तात्रय चोक',
  'Dattatreya, Bhaktapur',
  ST_SetSRID(ST_MakePoint(85.435, 27.6715), 4326)::geography,
  'bhaktapur-1'
);

INSERT INTO venues (id, name, name_nepali, address, location, constituency_id)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'Nepal Tourism Board Auditorium',
  'नेपाल पर्यटन बोर्ड सभागृह',
  'Pradarshani Marg, Kathmandu',
  ST_SetSRID(ST_MakePoint(85.325, 27.7), 4326)::geography,
  'ktm-1'
);

-- Events
INSERT INTO events (id, title, title_nepali, party_id, constituency_id, venue_id, event_type, status, description, datetime, end_time, speakers, expected_attendance, rsvp_count)
VALUES (
  'evt-001',
  'NC Rally: Vision for Kathmandu',
  'नेकां र्‍याली: काठमाडौंको दृष्टिकोण',
  'nc',
  'ktm-1',
  '00000000-0000-0000-0000-000000000001',
  'rally',
  'confirmed',
  'Major rally addressing youth employment and urban development',
  '2026-02-15T14:00:00+05:45',
  '2026-02-15T17:00:00+05:45',
  ARRAY['Sher Bahadur Deuba', 'Gagan Thapa'],
  5000,
  1234
);

INSERT INTO events (id, title, title_nepali, party_id, constituency_id, venue_id, event_type, status, description, datetime, end_time, speakers, expected_attendance, rsvp_count)
VALUES (
  'evt-002',
  'UML Town Hall: Economic Policy',
  'एमाले टाउन हल: आर्थिक नीति',
  'uml',
  'ktm-2',
  '00000000-0000-0000-0000-000000000002',
  'townhall',
  'confirmed',
  'Open discussion on economic reforms and foreign investment',
  '2026-02-16T10:00:00+05:45',
  '2026-02-16T13:00:00+05:45',
  ARRAY['K.P. Sharma Oli'],
  800,
  456
);

INSERT INTO events (id, title, title_nepali, party_id, constituency_id, venue_id, event_type, status, description, datetime, end_time, speakers, expected_attendance, rsvp_count)
VALUES (
  'evt-003',
  'RSP Anti-Corruption March',
  'रास्वपा भ्रष्टाचार विरोधी मार्च',
  'rsp',
  'ktm-1',
  '00000000-0000-0000-0000-000000000003',
  'march',
  'confirmed',
  'March demanding transparency and accountability from government',
  '2026-02-17T11:00:00+05:45',
  '2026-02-17T14:00:00+05:45',
  ARRAY['Rabi Lamichhane'],
  3000,
  892
);

INSERT INTO events (id, title, title_nepali, party_id, constituency_id, venue_id, event_type, status, description, datetime, end_time, speakers, expected_attendance, rsvp_count)
VALUES (
  'evt-004',
  'Maoist Centre: Farmers Meet',
  'माओवादी केन्द्र: किसान भेला',
  'maoist',
  'bhaktapur-1',
  '00000000-0000-0000-0000-000000000004',
  'meeting',
  'confirmed',
  'Addressing agricultural policies and farmer subsidies',
  '2026-02-18T13:00:00+05:45',
  '2026-02-18T16:00:00+05:45',
  ARRAY['Pushpa Kamal Dahal', 'Barsha Man Pun'],
  1200,
  234
);

INSERT INTO events (id, title, title_nepali, party_id, constituency_id, venue_id, event_type, status, description, datetime, end_time, speakers, expected_attendance, rsvp_count)
VALUES (
  'evt-005',
  'GenZ Youth Assembly',
  'जेनजी युवा सभा',
  'genz',
  'lalitpur-1',
  '00000000-0000-0000-0000-000000000005',
  'assembly',
  'confirmed',
  'Youth-led assembly on political reform and digital governance',
  '2026-02-19T15:00:00+05:45',
  '2026-02-19T18:00:00+05:45',
  ARRAY['Kishori Karki'],
  2500,
  1567
);

INSERT INTO events (id, title, title_nepali, party_id, constituency_id, venue_id, event_type, status, description, datetime, end_time, speakers, expected_attendance, rsvp_count)
VALUES (
  'evt-006',
  'NC Door-to-Door Campaign',
  'नेकां घरदैलो अभियान',
  'nc',
  'ktm-3',
  '00000000-0000-0000-0000-000000000006',
  'canvassing',
  'confirmed',
  'Volunteer canvassing in Kalimati neighborhoods',
  '2026-02-20T09:00:00+05:45',
  '2026-02-20T17:00:00+05:45',
  NULL,
  200,
  78
);

INSERT INTO events (id, title, title_nepali, party_id, constituency_id, venue_id, event_type, status, description, datetime, end_time, speakers, expected_attendance, rsvp_count)
VALUES (
  'evt-007',
  'UML Women''s Conference',
  'एमाले महिला सम्मेलन',
  'uml',
  'lalitpur-1',
  '00000000-0000-0000-0000-000000000007',
  'conference',
  'confirmed',
  'Conference on women''s political participation and rights',
  '2026-02-21T10:00:00+05:45',
  '2026-02-21T16:00:00+05:45',
  ARRAY['Bidya Devi Bhandari'],
  500,
  312
);

INSERT INTO events (id, title, title_nepali, party_id, constituency_id, venue_id, event_type, status, description, datetime, end_time, speakers, expected_attendance, rsvp_count)
VALUES (
  'evt-008',
  'JSP Federal Rights Rally',
  'जसपा संघीय अधिकार र्‍याली',
  'jsp',
  'ktm-2',
  '00000000-0000-0000-0000-000000000008',
  'rally',
  'confirmed',
  'Rally demanding stronger federal rights and Madhesh representation',
  '2026-02-22T14:00:00+05:45',
  '2026-02-22T17:00:00+05:45',
  ARRAY['Upendra Yadav'],
  4000,
  645
);

INSERT INTO events (id, title, title_nepali, party_id, constituency_id, venue_id, event_type, status, description, datetime, end_time, speakers, expected_attendance, rsvp_count)
VALUES (
  'evt-009',
  'RSP Candidate Introduction',
  'रास्वपा उम्मेदवार परिचय',
  'rsp',
  'bhaktapur-1',
  '00000000-0000-0000-0000-000000000009',
  'meeting',
  'confirmed',
  'Meet the RSP candidate for Bhaktapur-1',
  '2026-02-23T11:00:00+05:45',
  '2026-02-23T13:00:00+05:45',
  NULL,
  600,
  189
);

INSERT INTO events (id, title, title_nepali, party_id, constituency_id, venue_id, event_type, status, description, datetime, end_time, speakers, expected_attendance, rsvp_count)
VALUES (
  'evt-010',
  'Multi-Party Debate',
  'बहुदलीय वाद-विवाद',
  NULL,
  'ktm-1',
  '00000000-0000-0000-0000-000000000010',
  'debate',
  'confirmed',
  'Live televised debate between Kathmandu-1 candidates',
  '2026-02-25T18:00:00+05:45',
  '2026-02-25T21:00:00+05:45',
  ARRAY['Multiple Candidates'],
  400,
  398
);

-- Event Tags
INSERT INTO event_tags (event_id, tag) VALUES ('evt-001', 'youth');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-001', 'employment');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-001', 'urban');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-002', 'economy');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-002', 'investment');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-002', 'policy');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-003', 'corruption');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-003', 'transparency');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-003', 'accountability');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-004', 'agriculture');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-004', 'farmers');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-004', 'subsidies');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-005', 'youth');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-005', 'reform');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-005', 'digital');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-006', 'canvassing');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-006', 'volunteers');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-006', 'outreach');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-007', 'women');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-007', 'rights');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-007', 'participation');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-008', 'federalism');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-008', 'madhesh');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-008', 'rights');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-009', 'candidate');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-009', 'introduction');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-009', 'local');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-010', 'debate');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-010', 'candidates');
INSERT INTO event_tags (event_id, tag) VALUES ('evt-010', 'televised');

COMMIT;

-- ============================================================================
-- SEED COMPLETE
-- ============================================================================