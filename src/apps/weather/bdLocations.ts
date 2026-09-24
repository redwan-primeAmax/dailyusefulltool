/**
 * Bangladesh location database — all 64 districts across 8 divisions
 * with major towns / upazilas. Used by the Weather app's Location browser.
 */

export interface BdLocation {
  name: string;
  district: string;
  division: string;
}

/** Creates a district entry plus one entry per town. */
const d = (district: string, division: string, towns: string[] = []): BdLocation[] =>
  [district, ...towns].map((name) => ({ name, district, division }));

const RAW: BdLocation[][] = [
  /* ── Dhaka Division ─────────────────────────────── */
  d('Dhaka', 'Dhaka', ['Dhanmondi', 'Mirpur', 'Uttara', 'Motijheel', 'Banani', 'Gulshan', 'Savar', 'Tongi', 'Demra', 'Gazirampur']),
  d('Gazipur', 'Dhaka', ['Tongi', 'Sreepur', 'Kaliakair', 'Kapashia']),
  d('Kishoreganj', 'Dhaka', ['Pakundia', 'Kuliarchar', 'Hemayetpur']),
  d('Madaripur', 'Dhaka', ['Rajoir', 'Kalkini', 'Shibchar']),
  d('Manikganj', 'Dhaka', ['Saturia', 'Shibganj', 'Gauripur']),
  d('Munshiganj', 'Dhaka', ['Singair', 'Jamtola', 'Lohagara']),
  d('Narayanganj', 'Dhaka', ['Sonadanga', 'Rupganj', 'Simpurgacha']),
  d('Narsingdi', 'Dhaka', ['Belabdo', 'Patuli', 'Madhupur']),
  d('Faridpur', 'Dhaka', ['Alfadpur', 'Boal', 'Sadar']),
  d('Gopalganj', 'Dhaka', ['Kashiani', 'Tanda']),
  d('Shariatpur', 'Dhaka', ['Jhikargacha', 'Dhamoirpur', 'Naria']),
  d('Tangail', 'Dhaka', ['Ghatail', 'Sakhipur', 'Dhulio', 'Kalihati']),
  d('Rajbari', 'Dhaka', ['Bakshiganj', 'Shyampur', 'Pangsha']),

  /* ── Chattogram Division ────────────────────────── */
  d('Chattogram', 'Chattogram', ['Halishahar', 'Sitakunda', 'Rangunia', 'Lohagara', 'Hathazari', 'Pahartali', 'Kotugang']),
  d("Cox's Bazar", 'Chattogram', ['Teknaf', 'Ukhiya', 'Inani', 'Ramu', "St. Martin's Island", 'Kutubdia']),
  d('Bandarban', 'Chattogram', ['Ranamagi', 'Thanchi', 'Rowangchhari', 'Lama']),
  d('Brahmanbaria', 'Chattogram', ['Akhaura', 'Nasirnagar', 'Kasba', 'Bancharampur']),
  d('Chandpur', 'Chattogram', ['Haimchar', 'Kachua', 'Shahr']),
  d('Comilla', 'Chattogram', ['Daudkandi', 'Laksham', 'Brahmanpara', 'Tangail', 'Homna']),
  d('Feni', 'Chattogram', ['Parshuram', 'Sonagazi', 'Chhagalnaia']),
  d('Khagrachhari', 'Chattogram', ['Mahalchari', 'Dikhal', 'Rama'], ),
  d('Lakshmipur', 'Chattogram', ['Raipura', 'Haluaghat', 'Komdapara']),
  d('Noakhali', 'Chattogram', ['Atrai', 'Lalmatin', 'Sonai', 'Sadar']),
  d('Rangamati', 'Chattogram', ['Kaptai', 'Kumarkhali', 'Jura', 'Sajek']),

  /* ── Rajshahi Division ──────────────────────────── */
  d('Bogura', 'Rajshahi', ['Sherpur', 'Bera', 'Shibganj', 'Dhupchanchia', 'Gabtali']),
  d('Joypurhat', 'Rajshahi', ['Akhalia', 'Kalahati']),
  d('Naogaon', 'Rajshahi', ['Mohanpur', 'Sapahar', 'Badalgachhi', 'Dharnpur', 'Chatmohar']),
  d('Natore', 'Rajshahi', ['Singia', 'Baraigram', 'Lalmanirhat']),
  d('Chapainawabganj', 'Rajshahi', ['Shibganj', 'Goda', 'Nawabganj']),
  d('Pabna', 'Rajshahi', ['Atghoria', 'Ishwardi', 'Bera']),
  d('Sirajganj', 'Rajshahi', ['Shahajpur', 'Kazipura', 'Ullapara', 'Rajamhat']),
  d('Rajshahi', 'Rajshahi', ['Bagha', 'Charghat', 'Godagari', 'Boalia', 'Puthia']),

  /* ── Khulna Division ────────────────────────────── */
  d('Bagerhat', 'Khulna', ['Mokshapur', 'Chitalmari', 'Kalaroa']),
  d('Chuadanga', 'Khulna', ['Mehena', 'Jibannagar', 'Damurhuda']),
  d('Jashore', 'Khulna', ['Benapole', 'Sharsha', 'Bhairab', 'Chaugachha', 'Rajapur', 'Agailjhara']),
  d('Jhenaidah', 'Khulna', ['Kaliganj', 'Shyamnagar', 'Chauchar', 'Kotchandpur']),
  d('Khulna', 'Khulna', ['Dumuria', 'Sonadanga', 'Batiagacha', 'Dacope', 'Koyra', 'Fulbaria']),
  d('Kushtia', 'Khulna', ['Kumarkhali', 'Mirpur', 'Bheramara', 'Bheramara Road']),
  d('Magura', 'Khulna', ['Sreepur', 'Mohammadpur']),
  d('Meherpur', 'Khulna', ['Ganginar Char', 'Darbhanga']),
  d('Narail', 'Khulna', ['Aloarnoida', 'Kalia']),
  d('Satkhira', 'Khulna', ['Ashashuni', 'Debhatta', 'Shyamnagar', 'Tala']),

  /* ── Barishal Division ──────────────────────────── */
  d('Barishal', 'Barishal', ['Bakerganj', 'Mandargonj', 'Babuganj', 'Mehendraganj']),
  d('Bhola', 'Barishal', ['Tazumuddin', 'Char Fasson', 'Burhanuddin', 'Borhanuddin']),
  d('Patharghata', 'Barishal', ['Alamdngi', 'Gazirhat']),
  d('Pirojpur', 'Barishal', ['Mihijaur', 'Zianagar', 'Kapurthali']),
  d('Jhalokathi', 'Barishal', ['Nalaroga', 'Rajapur']),
  d('Barguna', 'Barishal', ['Amthan', 'Betaghat', 'Belandia']),

  /* ── Sylhet Division ────────────────────────────── */
  d('Habiganj', 'Sylhet', ['Lakshmipur', 'Nabiganj', 'Madupur', 'Chunarughat']),
  d('Moulvibazar', 'Sylhet', ['Kumbirhat', 'Jami', 'Ruma', 'Kamalganj', 'Ananda']),
  d('Sunamganj', 'Sylhet', ['Tahirpur', 'Dahaigram', 'Sadargaon', 'Daudkandi', 'Tamabil']),
  d('Sylhet', 'Sylhet', ['Zindabazar', 'Ambarkhana', 'Goalanda', 'Jaintiapur', 'Balaganj']),

  /* ── Rangpur Division ───────────────────────────── */
  d('Dinajpur', 'Rangpur', ['Fulbari', 'Birampur', 'Biral', 'Phulchari']),
  d('Gaibandha', 'Rangpur', ['Sreepur', 'Palashbari', 'Gobindaganj', 'Sadullapur']),
  d('Kurigram', 'Rangpur', ['Uthilia', 'Phulpur', 'Raghunathpur', 'Char Raijura']),
  d('Lalmonirhat', 'Rangpur', ['Hatibandha']),
  d('Nilphamari', 'Rangpur', ['Dimla', 'Saidhat', 'Kishorganj']),
  d('Panchagarh', 'Rangpur', ['Bholahat', 'Tetulia']),
  d('Rangpur', 'Rangpur', ['Mithapuri', 'Badargaon', 'Pirgachha', 'Mitha']),
  d('Thakurgaon', 'Rangpur', ['Pirganj', 'Ranishankar']),

  /* ── Mymensingh Division ────────────────────────── */
  d('Jamalpur', 'Mymensingh', ['Bakshiganj', 'Madarganj', 'Iswardi']),
  d('Mymensingh', 'Mymensingh', ['Trishal', 'Muktagachha', 'Bhaluka', 'Phulpur', 'Gafargaon']),
  d('Netrokona', 'Mymensingh', ['Khaliajuri', 'Purbinda', 'Durgapur', 'Barlekha']),
  d('Sherpur', 'Mymensingh', ['Nalitabari', 'Srichampan', 'Jakiganj']),
];

/** Flat list of every district + town for search / browse. */
export const BD_LOCATIONS: BdLocation[] = RAW.flat();

export const BD_DIVISIONS = [
  'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
];

export const BD_DISTRICTS: string[] = [...new Set(BD_LOCATIONS.map((l) => l.district))];

/** Deterministic pseudo-random value in [0,1) from a string — keeps
 *  simulated weather stable per location across visits. */
export function seedFrom(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}
