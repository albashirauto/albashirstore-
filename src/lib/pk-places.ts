// Pakistan: province -> district -> cities / towns (district HQ, tehsil towns and well-known towns).
// One line per district: "District: Town, Town, …". Shown A–Z in checkout; customers can still type a town that isn't listed.

const RAW: Record<string, string> = {
  Punjab: `
Attock: Attock, Fateh Jang, Hassan Abdal, Hazro, Jand, Pindi Gheb, Kamra, Basal, Bahtar, Rangoo
Bahawalnagar: Bahawalnagar, Chishtian, Fort Abbas, Haroonabad, Minchinabad, Dunga Bunga, Faqirwali, Madrassa, Mcleod Ganj, Khichiwala
Bahawalpur: Bahawalpur, Ahmadpur East, Hasilpur, Khairpur Tamewali, Yazman, Uch Sharif, Dera Nawab Sahib
Bhakkar: Bhakkar, Darya Khan, Kalurkot, Mankera, Dullewala, Jandanwala
Chakwal: Chakwal, Choa Saidan Shah, Kallar Kahar, Dhudial, Balkassar, Bhaun
Chiniot: Chiniot, Bhowana, Lalian, Rajoa
Dera Ghazi Khan: Dera Ghazi Khan, Kot Chutta, Choti Zareen, Shadan Lund, Fort Munro, Kala
Faisalabad: Faisalabad, Chak Jhumra, Jaranwala, Samundri, Tandlianwala, Dijkot, Khurrianwala, Satiana, Mamu Kanjan, Sahianwala
Gujranwala: Gujranwala, Kamoke, Nowshera Virkan, Qila Didar Singh, Eminabad, Ladhewala Warraich, Aroop
Gujrat: Gujrat, Kharian, Sarai Alamgir, Jalalpur Jattan, Lalamusa, Kunjah, Dinga, Shadiwal
Hafizabad: Hafizabad, Pindi Bhattian, Jalalpur Bhattian, Kassoki, Sukheke
Jhang: Jhang, Shorkot, Athara Hazari, Ahmadpur Sial, Garh Maharaja, Mochiwala
Jhelum: Jhelum, Dina, Pind Dadan Khan, Sohawa, Khewra, Domeli, Lilla
Kasur: Kasur, Chunian, Kot Radha Kishan, Pattoki, Khudian, Mustafabad, Raja Jang, Phool Nagar, Ellahabad, Kanganpur
Khanewal: Khanewal, Kabirwala, Mian Channu, Jahanian, Tulamba, Abdul Hakim, Sarai Sidhu
Khushab: Khushab, Jauharabad, Naushera, Quaidabad, Noorpur Thal, Mitha Tiwana, Hadali
Kot Addu: Kot Addu, Chowk Sarwar Shaheed, Sanawan, Daira Din Panah
Lahore: Lahore, Lahore Cantt, Raiwind, Kahna, Manga Mandi, Bedian, Shahdara
Layyah: Layyah, Chaubara, Karor Lal Esan, Fatehpur, Kot Sultan, Chowk Azam
Lodhran: Lodhran, Dunyapur, Kahror Pakka
Mandi Bahauddin: Mandi Bahauddin, Malakwal, Phalia, Pahrianwali
Mianwali: Mianwali, Isa Khel, Piplan, Kalabagh, Kundian, Daud Khel, Chashma, Wan Bhachran
Multan: Multan, Multan Cantt, Jalalpur Pirwala, Shujabad, Qadirpur Raan, Makhdoom Rashid
Murree: Murree, Kotli Sattian, Bhurban
Muzaffargarh: Muzaffargarh, Alipur, Jatoi, Khangarh, Shehr Sultan, Rangpur
Nankana Sahib: Nankana Sahib, Sangla Hill, Shahkot, Warburton, Mor Khunda
Narowal: Narowal, Shakargarh, Zafarwal, Baddomalhi, Noorkot
Okara: Okara, Depalpur, Renala Khurd, Haveli Lakha, Basirpur, Hujra Shah Muqeem, Mandi Ahmadabad, Shergarh, Satghara, Gamber, Akhtarabad
Pakpattan: Pakpattan, Arifwala, Qaboola, Noorpur, Malka Hans
Rahim Yar Khan: Rahim Yar Khan, Sadiqabad, Khanpur, Liaquatpur, Kot Samaba, Zahir Pir, Trinda, Allahabad, Ahmedpur Lamma
Rajanpur: Rajanpur, Jampur, Rojhan, Fazilpur, Kot Mithan
Rawalpindi: Rawalpindi, Rawalpindi Cantt, Gujar Khan, Kahuta, Kallar Syedan, Taxila, Wah Cantt, Rawat, Daultala, Mandra, Chak Beli Khan
Sahiwal: Sahiwal, Chichawatni, Harappa, Kamir, Noor Shah, Yousafwala, Iqbal Nagar
Sargodha: Sargodha, Bhalwal, Kot Momin, Sahiwal (Sargodha), Shahpur, Sillanwali, Bhera, Bhagtanwala, Phularwan, Midh Ranjha
Sheikhupura: Sheikhupura, Ferozewala, Muridke, Safdarabad, Sharaqpur, Narang Mandi, Farooqabad, Kot Abdul Malik
Sialkot: Sialkot, Daska, Pasrur, Sambrial, Kotli Loharan, Chawinda, Ugoki, Begowala
Talagang: Talagang, Lawa, Tamman, Multan Khurd
Taunsa: Taunsa Sharif, Vehova
Toba Tek Singh: Toba Tek Singh, Gojra, Kamalia, Pirmahal, Rajana
Vehari: Vehari, Burewala, Mailsi, Gaggo Mandi, Machiwal, Luddan, Tibba Sultanpur, Karampur
Wazirabad: Wazirabad, Alipur Chatha, Ahmad Nagar Chatha, Rasool Nagar`,

  Sindh: `
Badin: Badin, Matli, Talhar, Tando Bago, Golarchi
Dadu: Dadu, Johi, Khairpur Nathan Shah, Mehar, Radhan
Ghotki: Ghotki, Daharki, Mirpur Mathelo, Ubauro, Khangarh
Hyderabad: Hyderabad, Latifabad, Qasimabad, Hyderabad Cantt, Tando Jam, Hatri
Jacobabad: Jacobabad, Garhi Khairo, Thul
Jamshoro: Jamshoro, Kotri, Sehwan, Manjhand, Thano Bula Khan
Karachi Central: North Nazimabad, Nazimabad, Gulberg (Karachi), Liaquatabad, New Karachi, Federal B Area
Karachi East: Gulshan-e-Iqbal, Gulistan-e-Jauhar, Jamshed Town, Ferozabad, PECHS, Scheme 33
Karachi South: Saddar, Clifton, DHA Karachi, Lyari, Garden, Kharadar
Karachi West: Orangi Town, SITE, Manghopir, Mominabad
Kashmore: Kashmore, Kandhkot, Tangwani
Keamari: Keamari, Baldia Town, Manora, Mauripur
Khairpur: Khairpur, Gambat, Kingri, Kot Diji, Mirwah, Nara, Sobho Dero, Faiz Ganj, Thari Mirwah, Ranipur
Korangi: Korangi, Landhi, Shah Faisal Colony, Model Colony
Larkana: Larkana, Bakrani, Dokri, Ratodero
Malir: Malir, Malir Cantt, Bin Qasim, Gadap, Ibrahim Hyderi
Matiari: Matiari, Hala, Saeedabad, Bhit Shah
Mirpur Khas: Mirpur Khas, Digri, Jhuddo, Kot Ghulam Muhammad, Sindhri, Hussain Bux Mari
Naushahro Feroze: Naushahro Feroze, Bhiria, Kandiaro, Mehrabpur, Moro
Qambar Shahdadkot: Qambar, Shahdadkot, Miro Khan, Nasirabad (Sindh), Warah, Qubo Saeed Khan, Sijawal Junejo
Sanghar: Sanghar, Shahdadpur, Tando Adam, Jam Nawaz Ali, Khipro, Sinjhoro
Shaheed Benazirabad: Nawabshah, Daur, Qazi Ahmed, Sakrand
Shikarpur: Shikarpur, Garhi Yasin, Khanpur (Sindh), Lakhi
Sujawal: Sujawal, Jati, Kharo Chan, Mirpur Bathoro, Shah Bandar
Sukkur: Sukkur, Rohri, Pano Aqil, Salehpat, New Sukkur
Tando Allahyar: Tando Allahyar, Chamber, Jhando Mari
Tando Muhammad Khan: Tando Muhammad Khan, Bulri Shah Karim, Tando Ghulam Hyder
Tharparkar: Mithi, Islamkot, Chachro, Diplo, Nagarparkar, Dahli, Kaloi
Thatta: Thatta, Makli, Ghorabari, Keti Bandar, Mirpur Sakro, Gharo
Umerkot: Umerkot, Kunri, Pithoro, Samaro`,

  "Khyber Pakhtunkhwa": `
Abbottabad: Abbottabad, Havelian, Nathia Gali, Lora, Kakul
Bajaur: Khar, Nawagai, Salarzai, Mamund, Inayat Kili
Bannu: Bannu, Domel, Kakki, Miryan
Battagram: Battagram, Allai, Thakot
Buner: Daggar, Swari, Gagra, Totalai, Gadezai, Pir Baba
Charsadda: Charsadda, Tangi, Shabqadar, Utmanzai, Prang
Dera Ismail Khan: Dera Ismail Khan, Kulachi, Paharpur, Daraban, Paroa
Hangu: Hangu, Thall, Doaba
Haripur: Haripur, Khanpur (Haripur), Ghazi, Hattar, Kot Najibullah
Karak: Karak, Banda Daud Shah, Takht-e-Nasrati
Khyber: Landi Kotal, Jamrud, Bara, Torkham
Kohat: Kohat, Lachi, Gumbat, Darra Adam Khel, Shakardara
Kolai Palas: Palas, Kolai
Kurram: Parachinar, Sadda, Alizai
Lakki Marwat: Lakki Marwat, Serai Naurang, Ghazni Khel
Lower Chitral: Chitral, Drosh, Garam Chashma, Ayun
Lower Dir: Timergara, Chakdara, Balambat, Munda, Samarbagh, Adenzai, Talash
Lower Kohistan: Pattan, Bankad
Lower South Waziristan: Wana, Birmal, Angoor Adda
Malakand: Batkhela, Dargai, Thana, Sakhakot
Mansehra: Mansehra, Balakot, Oghi, Shinkiari, Kaghan, Naran, Darband
Mardan: Mardan, Takht Bhai, Katlang, Rustam, Shergarh (Mardan), Lund Khwar
Mohmand: Ghalanai, Ekka Ghund, Pindiali, Halimzai
North Waziristan: Miranshah, Mir Ali, Razmak, Datta Khel, Spinwam
Nowshera: Nowshera, Nowshera Cantt, Pabbi, Jehangira, Risalpur, Akora Khattak
Orakzai: Kalaya, Ghiljo
Peshawar: Peshawar, Peshawar Cantt, Hayatabad, Badaber, Chamkani, Mathra, Matani
Shangla: Alpuri, Besham, Puran, Chakesar, Martung
Swabi: Swabi, Topi, Lahor, Razar, Zaida
Swat: Mingora, Saidu Sharif, Matta, Kabal, Barikot, Khwazakhela, Bahrain, Kalam, Charbagh, Madyan
Tank: Tank, Jandola
Torghar: Judba, Kandar Hassanzai
Upper Chitral: Booni, Mastuj, Torkhow, Mulkhow
Upper Dir: Dir, Wari, Sheringal, Barawal, Kalkot
Upper Kohistan: Dasu, Kandia, Harban
Upper South Waziristan: Ladha, Makeen, Sararogha, Tiarza`,

  Balochistan: `
Awaran: Awaran, Jhal Jhao, Mashkai
Barkhan: Barkhan, Rakhni
Chagai: Dalbandin, Nokkundi, Taftan, Chagai
Chaman: Chaman
Dera Bugti: Dera Bugti, Sui, Pir Koh
Duki: Duki
Gwadar: Gwadar, Pasni, Ormara, Jiwani, Surbandar
Harnai: Harnai, Shahrig
Hub: Hub, Gadani, Dureji
Jafarabad: Dera Allah Yar, Gandakha, Rojhan Jamali
Jhal Magsi: Gandava, Jhal Magsi
Kachhi: Dhadar, Mach, Bhag, Sanni
Kalat: Kalat, Mangochar
Kech: Turbat, Tump, Buleda, Mand, Dasht
Kharan: Kharan
Khuzdar: Khuzdar, Wadh, Nal, Zehri, Karakh
Killa Abdullah: Killa Abdullah, Gulistan
Killa Saifullah: Killa Saifullah, Muslim Bagh
Kohlu: Kohlu, Kahan
Lasbela: Uthal, Bela, Sonmiani, Winder
Lehri: Lehri
Loralai: Loralai, Mekhtar
Mastung: Mastung, Kardigap
Musakhel: Musakhel
Nasirabad: Dera Murad Jamali, Tamboo, Chattar
Nushki: Nushki
Panjgur: Panjgur
Pishin: Pishin, Khanozai, Karezat, Saranan
Quetta: Quetta, Quetta Cantt, Kuchlak
Sherani: Sherani
Sibi: Sibi, Kutmandai
Sohbatpur: Sohbatpur
Surab: Surab
Usta Muhammad: Usta Muhammad
Washuk: Washuk, Besima
Zhob: Zhob, Qamar Din Karez
Ziarat: Ziarat, Sanjawi`,

  "Islamabad Capital Territory": `
Islamabad: Islamabad, Bhara Kahu, Tarlai, Tarnol, Sihala, Bani Gala, Shahzad Town`,

  "Gilgit-Baltistan": `
Astore: Eidgah, Gorikot, Astore
Darel: Darel
Diamer: Chilas
Ghanche: Khaplu
Ghizer: Gahkuch, Punial, Ishkoman
Gilgit: Gilgit, Danyore, Juglot
Gupis-Yasin: Gupis, Yasin
Hunza: Aliabad, Karimabad, Gulmit, Sost
Kharmang: Tolti, Mehdiabad
Nagar: Nagar, Chalt
Roundu: Dambudas
Shigar: Shigar
Skardu: Skardu
Tangir: Tangir`,

  "Azad Kashmir": `
Bagh: Bagh, Dhirkot, Harighel
Bhimber: Bhimber, Barnala, Samahni
Hattian Bala: Hattian Bala, Chikar
Haveli: Forward Kahuta
Kotli: Kotli, Sehnsa, Fatehpur Thakiala, Charhoi, Khuiratta
Mirpur: Mirpur, Dadyal, Chakswari, Islamgarh
Muzaffarabad: Muzaffarabad, Patika
Neelum: Athmuqam, Sharda, Kel
Poonch: Rawalakot, Hajira, Abbaspur, Thorar
Sudhnoti: Pallandri, Trarkhal, Mang`,
};

const az = (a: string, b: string) => a.localeCompare(b);

/** { province: { district: [towns A–Z] } } */
export const PK_PLACES: Record<string, Record<string, string[]>> = Object.fromEntries(
  Object.entries(RAW).map(([prov, text]) => [prov, Object.fromEntries(
    text.trim().split("\n").map((line): [string, string[]] => {
      const [d, towns] = line.split(":");
      return [d.trim(), towns.split(",").map((t) => t.trim()).filter(Boolean).sort(az)];
    }).sort((a, b) => az(a[0], b[0])),
  )]),
);

export const PROVINCES = Object.keys(PK_PLACES).sort(az);
export const districtsOf = (province: string) => Object.keys(PK_PLACES[province] ?? {});
export const townsOf = (province: string, district: string) => PK_PLACES[province]?.[district] ?? [];

/** "Haveli Lakha, Okara, Punjab" (district left out when it is the same as the city). */
export const placeLine = (o: { city?: string | null; district?: string | null; province?: string | null }) =>
  [o.city, o.district && o.district !== o.city ? o.district : null, o.province].filter(Boolean).join(", ");
