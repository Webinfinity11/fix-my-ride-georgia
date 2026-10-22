// Public catalogue snapshot keeps crawlable navigation available while metadata loads.
// Editorial demand order, shared across catalogue pages; not live analytics.
export const categoryDemandOrder = [11, 17, 15, 14, 16, 13, 20, 25, 12, 21, 52, 51, 19, 28, 54, 26, 23, 29, 24, 49, 40, 27, 50, 53, 18, 39, 42, 43, 36, 30, 33, 22, 38, 41, 55, 35, 34, 31, 32, 37];

export const categoryNavigationSnapshot = [
  {
    "id": 11,
    "name": "ძრავის შეკეთება"
  },
  {
    "id": 12,
    "name": "გადაცემათა კოლოფი"
  },
  {
    "id": 13,
    "name": "სავალი ნაწილის შეკეთება"
  },
  {
    "id": 14,
    "name": "ზეთის შეცვლა"
  },
  {
    "id": 15,
    "name": "ვულკანიზაცია"
  },
  {
    "id": 16,
    "name": "ელექტროობა"
  },
  {
    "id": 17,
    "name": "დიაგნოსტიკა"
  },
  {
    "id": 18,
    "name": "მანქანის სალონი"
  },
  {
    "id": 19,
    "name": "ჰიბრიდული სისტემა"
  },
  {
    "id": 20,
    "name": "სამღებრო სამუშაოები"
  },
  {
    "id": 21,
    "name": "სათუნუქე სამუშაოები"
  },
  {
    "id": 22,
    "name": "პლასმასის აღდგენა"
  },
  {
    "id": 23,
    "name": "ფარების აღდგენა"
  },
  {
    "id": 24,
    "name": "საქარე მინები"
  },
  {
    "id": 25,
    "name": "კონდინციონერი (ფრეონი)"
  },
  {
    "id": 26,
    "name": "ქიმწმენდა"
  },
  {
    "id": 27,
    "name": "წყლის სისტემა"
  },
  {
    "id": 28,
    "name": "პოლირება"
  },
  {
    "id": 29,
    "name": "მინების დამუქება"
  },
  {
    "id": 30,
    "name": "დისკების შეღებვა/აღდგენა"
  },
  {
    "id": 31,
    "name": "კარის გაღება"
  },
  {
    "id": 32,
    "name": "საღებავების შეზავება"
  },
  {
    "id": 33,
    "name": "ფირის გადაკვრა"
  },
  {
    "id": 34,
    "name": "დაშლილები"
  },
  {
    "id": 35,
    "name": "ახალი ნაწილები"
  },
  {
    "id": 36,
    "name": "საჭის სისტემა"
  },
  {
    "id": 37,
    "name": "ვიზუალური დეტალები"
  },
  {
    "id": 38,
    "name": "ტუნინგი"
  },
  {
    "id": 39,
    "name": "გამონაბოლქვის სისტემა"
  },
  {
    "id": 40,
    "name": "თვლების შეყრა"
  },
  {
    "id": 41,
    "name": "წვის სისტემა"
  },
  {
    "id": 42,
    "name": "კატალიზატორის სერვისი"
  },
  {
    "id": 43,
    "name": "გაზის სისტემის მონტაჟი/შეკეთება"
  },
  {
    "id": 49,
    "name": "დინამოს და სტარტერის შეკეთება"
  },
  {
    "id": 50,
    "name": "მანქანის გასაღები"
  },
  {
    "id": 51,
    "name": "აირბაგი"
  },
  {
    "id": 52,
    "name": "აკუმულატორი"
  },
  {
    "id": 53,
    "name": "აალების სანთლები"
  },
  {
    "id": 54,
    "name": "დითეილინგი"
  },
  {
    "id": 55,
    "name": "დაზიანებული ავტომობილის სრული აღდგენა"
  }
];

export function sortCategoriesByDemand<T extends { id: number; name: string }>(categories: T[]): T[] {
  const rank = (id: number) => {
    const index = categoryDemandOrder.indexOf(id);
    return index < 0 ? categoryDemandOrder.length : index;
  };
  return [...categories].sort((a, b) => rank(a.id) - rank(b.id) || a.id - b.id);
}
