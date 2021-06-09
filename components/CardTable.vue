<template>
  <v-simple-table>
    <tbody>
      <tr>
        <th>
          カードRANK
        </th>
        <th>
          カード名
        </th>
        <th>
          枚数
        </th>
        <th>
          効果名
        </th>
        <th>
          説明
        </th>
      </tr>
      <tr v-for="card in cards" :key="card.rank">
        <td>
          {{ card.rank }}
        </td>
        <td>
          {{ card.name }}
        </td>
        <td>
          {{ card.num }}
        </td>
        <td>
          {{ card.effect }}
        </td>
        <td>
          {{ card.explanation }}
        </td>
      </tr>
      </tbody>
    </v-simple-table>
</template>

<script>
export default {
  name: 'CardTable',
  data () {
    return {
      cards: [
        { rank: 1,
          name: '少年',
          num: 2,
          effect: '革命',
          explanation: '1枚目の捨て札は何の効果も発動しないが、場に2枚目が出た時には皇帝と同じ効果「公開処刑」が発動する。'
        },
        { rank: 2,
          name: '兵士',
          num: 2,
          effect: '捜査',
          explanation: '指名した相手の手札を言い当てると相手は脱落する。'
        },
        { rank: 3,
          name: '占師',
          num: 2,
          effect: '透視',
          explanation: '指名した相手の手札を見る。'
        },
        { rank: 4,
          name: '乙女',
          num: 2,
          effect: '守護',
          explanation: '次の自分の手番まで自分への効果を無効にする。'
        },
        { rank: 5,
          name: '死神',
          num: 2,
          effect: '疫病',
          explanation: '指名した相手に山札から1枚引かせる。2枚になった相手の手札をランダムに1枚捨てさせる。'
        },
        { rank: 6,
          name: '貴族',
          num: 2,
          effect: '対面',
          explanation: '指名した相手と手札を見せ合う。(1枚目の効果)'
        },
        { rank: 6,
          name: '貴族',
          num: 2,
          effect: '対決',
          explanation: '指名した相手と手札を見せ合い、数字の小さい方が脱落する。(2枚目の効果)'
        },
        { rank: 7,
          name: '賢者',
          num: 2,
          effect: '選択',
          explanation: '次の手番で山札から１枚引くかわりに３枚引き、そのうち１枚を選ぶことができる。残り２枚は山札へ戻す。(戻したあと山札はシャッフルされる)'
        },
        { rank: 8,
          name: '精霊',
          num: 2,
          effect: '交換',
          explanation: '指名した相手の手札と自分の持っている手札を交換する。'
        },
        { rank: 9,
          name: '皇帝',
          num: 1,
          effect: '公開処刑',
          explanation: '指名した相手に山札から1枚引かせて、手札を2枚とも公開させる。そしてどちらか1枚を指定し捨てさせる。'
        },
        { rank: 10,
          name: '英雄',
          num: 1,
          effect: '潜伏・転生',
          explanation: '場に出すことができず、捨てさせられたら脱落する。皇帝以外に脱落させられた時に転生札で復活する。'
        }
      ]
    }
  }
}
</script>

<style scoped>
td {
  border-collapse: collapse;
  border: 1px solid #333;
}
th {
  border-collapse: collapse;
  border: 1px solid #333;
}
</style>
