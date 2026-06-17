// Parental gate (Kids Category, Guideline 1.3) — a tiny tap-only math check that
// stands between the player and the coin market. Web port keeps the same
// embedded-overlay contract the MarketModal relies on.
import React, { useMemo, useState } from 'react'
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native'

function makeQuestion() {
  const a = 2 + Math.floor(Math.random() * 7)
  const b = 2 + Math.floor(Math.random() * 7)
  const answer = a * b
  const set = new Set([answer])
  while (set.size < 3) set.add(answer + (Math.floor(Math.random() * 9) - 4) || answer + 1)
  const options = [...set].sort(() => Math.random() - 0.5)
  return { a, b, answer, options }
}

export function ParentalGate({ visible, embedded, onSuccess, onCancel }) {
  const [q, setQ] = useState(makeQuestion)
  const [wrong, setWrong] = useState(false)

  const card = useMemo(
    () => ({
      backgroundColor: '#fff', borderRadius: 22, padding: 24, width: 300,
      alignItems: 'center', gap: 10,
    }),
    [],
  )

  if (!visible) return null

  const pick = (n) => {
    if (n === q.answer) { setWrong(false); onSuccess && onSuccess() }
    else { setWrong(true); setQ(makeQuestion()) }
  }

  const Body = (
    <View
      style={{
        position: embedded ? 'absolute' : 'relative',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <View style={card}>
        <Text style={{ fontSize: 30 }}>🔒</Text>
        <Text style={{ fontFamily: 'FredokaOne_400Regular', fontSize: 17, color: '#14532D' }}>
          Ask a grown-up
        </Text>
        <Text style={{ fontFamily: 'FredokaOne_400Regular', fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
          To continue, solve: {q.a} × {q.b}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
          {q.options.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => pick(opt)}
              activeOpacity={0.8}
              style={{
                minWidth: 56, paddingVertical: 12, paddingHorizontal: 8,
                borderRadius: 13, backgroundColor: '#6D4BE0', alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'FredokaOne_400Regular', fontSize: 16, color: '#fff' }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {wrong && (
          <Text style={{ fontFamily: 'FredokaOne_400Regular', fontSize: 11, color: '#DC2626' }}>
            Not quite — try the new one ☝️
          </Text>
        )}
        <TouchableOpacity onPress={onCancel} style={{ marginTop: 4, padding: 8 }}>
          <Text style={{ fontFamily: 'FredokaOne_400Regular', fontSize: 12, color: '#9CA3AF' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (embedded) return Body
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={{ flex: 1 }} onPress={onCancel}>{Body}</Pressable>
    </Modal>
  )
}

export default ParentalGate
